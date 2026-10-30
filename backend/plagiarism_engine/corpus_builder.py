"""
arXiv Corpus Builder for ThesisGuard RAG Pipeline
Fetches academic paper abstracts from arXiv (free, no API key required)
and indexes them into the local ChromaDB vector store.
"""

import logging
import time
import xml.etree.ElementTree as ET

import requests

from .analyzer import get_analyzer

logger = logging.getLogger(__name__)

ARXIV_API_URL = "http://export.arxiv.org/api/query"
# arXiv uses a default (un-prefixed) Atom namespace — use curly-brace URI syntax
ATOM = "{http://www.w3.org/2005/Atom}"

# Polite rate limit — arXiv asks for max 3 req/sec
REQUEST_DELAY_SECONDS = 0.4


def fetch_arxiv_papers(query: str, max_results: int = 20) -> list:
    """
    Query the arXiv API and return a list of paper dicts with
    keys: id, title, abstract, authors, published, url
    """
    params = {
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": max_results,
        "sortBy": "relevance",
        "sortOrder": "descending",
    }

    try:
        response = requests.get(ARXIV_API_URL, params=params, timeout=15)
        response.raise_for_status()
    except requests.RequestException as e:
        logger.error(f"arXiv API request failed: {e}")
        raise ConnectionError(f"Could not reach arXiv API: {e}")

    root = ET.fromstring(response.text)
    papers = []

    for entry in root.findall(f"{ATOM}entry"):
        arxiv_id_raw = entry.find(f"{ATOM}id")
        title_el     = entry.find(f"{ATOM}title")
        summary_el   = entry.find(f"{ATOM}summary")
        published_el = entry.find(f"{ATOM}published")

        if arxiv_id_raw is None or summary_el is None:
            continue

        # Extract short arXiv ID from full URL (e.g. "2301.01234")
        arxiv_id = arxiv_id_raw.text.strip().split("/")[-1]

        authors = [
            a.find(f"{ATOM}name").text.strip()
            for a in entry.findall(f"{ATOM}author")
            if a.find(f"{ATOM}name") is not None
        ]

        papers.append({
            "id": arxiv_id,
            "title": (title_el.text or "").strip().replace("\n", " "),
            "abstract": (summary_el.text or "").strip().replace("\n", " "),
            "authors": authors,
            "published": (published_el.text or "")[:10] if published_el is not None else "",
            "url": f"https://arxiv.org/abs/{arxiv_id}",
        })

    return papers


def build_corpus_from_arxiv(
    query: str,
    max_results: int = 20,
) -> dict:
    """
    Main entry point: fetch arXiv papers for a query and index them
    into ChromaDB so the plagiarism engine can compare against them.

    Args:
        query:        Search query (e.g. topic of the thesis)
        max_results:  How many papers to fetch (max 100 per arXiv policy)

    Returns:
        Summary dict with counts and indexed paper IDs.
    """
    logger.info(f"Fetching {max_results} arXiv papers for query: '{query}'")
    papers = fetch_arxiv_papers(query, max_results)

    if not papers:
        return {
            "indexed": 0,
            "failed": 0,
            "papers": [],
            "message": "No papers found for query.",
        }

    analyzer = get_analyzer()
    indexed = []
    failed = []

    for paper in papers:
        try:
            text_to_index = paper["abstract"]

            if not text_to_index.strip():
                failed.append(paper["id"])
                continue

            doc_id = f"arxiv_{paper['id']}"
            metadata = {
                "source": "arxiv",
                "arxiv_id": paper["id"],
                "title": paper["title"][:200],  # ChromaDB metadata length limit
                "published": paper["published"],
                "url": paper["url"],
                "query": query[:100],
            }

            analyzer.index_document(doc_id=doc_id, text=text_to_index, metadata=metadata)
            indexed.append({"id": paper["id"], "title": paper["title"]})
            logger.info(f"  Indexed: [{paper['id']}] {paper['title'][:60]}...")

            # Respect arXiv rate limit
            time.sleep(REQUEST_DELAY_SECONDS)

        except Exception as e:
            logger.error(f"  Failed to index {paper['id']}: {e}")
            failed.append(paper["id"])

    return {
        "indexed": len(indexed),
        "failed": len(failed),
        "papers": indexed,
        "query": query,
        "message": f"Successfully indexed {len(indexed)} arXiv papers into ChromaDB.",
    }
