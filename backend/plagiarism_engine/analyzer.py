import json
import logging
import os
import sqlite3
import threading
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

ENGINE_DIR = Path(__file__).resolve().parent
CORPUS_DB_PATH = ENGINE_DIR / "corpus.db"
SEED_FILE_PATH = ENGINE_DIR / "corpus_seed.json"


def extract_text_from_file(file_path: str) -> str:
    """
    Extract text rapidly from PDF, DOCX, DOC, or TXT files.
    Uses PyMuPDF (fitz) for PDF which extracts 300+ pages in ~2.5 seconds.
    """
    if not file_path or not os.path.exists(file_path):
        return ""

    ext = os.path.splitext(file_path)[1].lower()
    content = ""

    if ext == ".pdf":
        # 1. Primary: PyMuPDF (fastest PDF extractor in Python, ~10-20x faster than PyPDF2)
        try:
            import pymupdf  # PyMuPDF
            with pymupdf.open(file_path) as pdf_doc:
                pages_text = [page.get_text() for page in pdf_doc]
                content = "\n".join(pages_text)
        except Exception as e:
            logger.warning(f"PyMuPDF extraction failed for {file_path}: {e}")

        # 2. Fallback: PyPDF2 if pymupdf encounters an encrypted or corrupted stream
        if not content.strip():
            try:
                import PyPDF2

                with open(file_path, "rb") as f:
                    reader = PyPDF2.PdfReader(f)
                    content = "\n".join(page.extract_text() or "" for page in reader.pages)
            except Exception:
                content = ""

    elif ext in [".doc", ".docx"]:
        try:
            import docx
            doc = docx.Document(file_path)
            content = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except Exception as e:
            logger.warning(f"DOCX extraction failed for {file_path}: {e}")
            content = ""

    elif ext in [".txt", ".md"]:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except Exception:
            content = ""

    return content.strip()


class PlagiarismAnalyzer:
    """
    High-performance, instant plagiarism analyzer.
    - Uses N-gram TF-IDF vectorization with sublinear term frequency scaling and cosine similarity.
    - Performs full document analysis in seconds (even for 180 to 300+ page theses).
    - Stores and queries corpus chunks using an embedded, thread-safe SQLite database in WAL mode.
    - Zero network dependencies, zero model download hangs, zero file-lock contention.
    """

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = str(db_path or CORPUS_DB_PATH)
        self._lock = threading.Lock()
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        """Create a thread-safe connection with WAL mode enabled."""
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute("PRAGMA synchronous = NORMAL")
        return conn

    def _init_db(self):
        """Initialize SQLite corpus table and seed if empty."""
        with self._lock:
            with self._get_connection() as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS corpus_chunks (
                        id TEXT PRIMARY KEY,
                        doc_id TEXT,
                        text TEXT,
                        source TEXT,
                        title TEXT
                    )
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_doc_id ON corpus_chunks(doc_id)")
                conn.commit()

                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM corpus_chunks")
                count = cursor.fetchone()[0]

                # Seed from corpus_seed.json if database is fresh
                if count == 0 and SEED_FILE_PATH.exists():
                    try:
                        with open(SEED_FILE_PATH, "r", encoding="utf-8") as f:
                            seeds = json.load(f)
                        rows = []
                        for s in seeds:
                            cid = s.get("id") or str(len(rows))
                            meta = s.get("metadata") or {}
                            doc_id = meta.get("doc_id") or cid
                            source = meta.get("source") or "seed"
                            title = meta.get("title") or "Academic Source"
                            doc_text = s.get("document") or ""
                            if doc_text.strip():
                                rows.append((cid, doc_id, doc_text, source, title))
                        if rows:
                            conn.executemany(
                                "INSERT OR REPLACE INTO corpus_chunks VALUES (?, ?, ?, ?, ?)",
                                rows
                            )
                            conn.commit()
                            logger.info(f"Seeded {len(rows)} reference documents into corpus.")
                    except Exception as e:
                        logger.warning(f"Could not load corpus seeds: {e}")

    def chunk_text(self, text: str, chunk_size: int = 200) -> List[str]:
        """
        Split text into overlapping or sequential word-based chunks.
        Adjusts chunk size adaptively for very large documents.
        """
        words = text.split()
        if not words:
            return []

        # Adapt chunk size for large documents (ensures fast analysis)
        if len(words) > 30000:  # ~100+ pages
            actual_size = max(chunk_size, 350)
        elif len(words) > 10000:  # ~30-100 pages
            actual_size = max(chunk_size, 250)
        else:
            actual_size = chunk_size

        return [
            " ".join(words[i : i + actual_size])
            for i in range(0, len(words), actual_size)
        ]

    def index_document(self, doc_id: str, text: str, metadata: Optional[Dict[str, Any]] = None):
        """
        Split a document into chunks and store in the corpus database.
        """
        chunks = self.chunk_text(text)
        if not chunks:
            return

        meta = metadata or {}
        source = meta.get("source") or "submission"
        title = meta.get("title") or f"Doc {doc_id}"

        rows = []
        for i, chunk in enumerate(chunks):
            cid = f"{doc_id}_chunk_{i}"
            rows.append((cid, doc_id, chunk, source, title))

        with self._lock:
            with self._get_connection() as conn:
                conn.executemany(
                    "INSERT OR REPLACE INTO corpus_chunks VALUES (?, ?, ?, ?, ?)",
                    rows
                )
                conn.commit()

    def analyze_submission(
        self,
        doc_id: str,
        text: str,
        threshold: float = 0.28
    ) -> Tuple[float, List[Dict[str, Any]]]:
        """
        Single-pass high-speed plagiarism analysis:
        1. Chunks document.
        2. Compares against all other corpus documents using N-gram TF-IDF cosine similarity.
        3. Indexes the document chunks into the corpus for future checks.
        Returns: (plagiarism_score_percentage, list_of_matches)
        """
        chunks = self.chunk_text(text)
        if not chunks:
            return 0.0, []

        # Query all existing chunks not belonging to this doc_id
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, doc_id, text, title FROM corpus_chunks WHERE doc_id != ?",
                (doc_id,)
            )
            corpus_rows = cursor.fetchall()

        matches = []
        plagiarized_chunks = 0

        if corpus_rows:
            corpus_texts = [r[2] for r in corpus_rows]
            corpus_titles = [r[3] for r in corpus_rows]

            # Vectorize query chunks and corpus chunks together
            all_texts = corpus_texts + chunks
            vec = TfidfVectorizer(
                ngram_range=(1, 2),
                stop_words="english",
                sublinear_tf=True,
                max_features=25000
            )
            tfidf_all = vec.fit_transform(all_texts)
            c_mat = tfidf_all[: len(corpus_texts)]
            q_mat = tfidf_all[len(corpus_texts) :]

            # Compute pairwise cosine similarity matrix
            sim_matrix = cosine_similarity(q_mat, c_mat)

            for i in range(len(chunks)):
                best_idx = int(sim_matrix[i].argmax())
                best_sim = float(sim_matrix[i][best_idx])

                if best_sim >= threshold:
                    plagiarized_chunks += 1
                    sim_pct = round(min(100.0, best_sim * 100.0), 1)
                    matches.append({
                        "original_chunk": chunks[i],
                        "matched_source": corpus_texts[best_idx],
                        "similarity_score": sim_pct,
                    })

        total_chunks = len(chunks)
        score = round((plagiarized_chunks / total_chunks) * 100.0, 1)

        # Index current document chunks so subsequent submissions compare against it
        self.index_document(doc_id, text, metadata={"source": "submission", "title": f"Submission {doc_id}"})

        return score, matches

    def check_plagiarism(
        self,
        text: str,
        threshold: float = 0.28,
        exclude_doc_id: Optional[str] = None
    ) -> Tuple[float, List[Dict[str, Any]]]:
        """
        Check plagiarism without indexing side-effects.
        """
        chunks = self.chunk_text(text)
        if not chunks:
            return 0.0, []

        with self._get_connection() as conn:
            cursor = conn.cursor()
            if exclude_doc_id:
                cursor.execute(
                    "SELECT id, doc_id, text, title FROM corpus_chunks WHERE doc_id != ?",
                    (exclude_doc_id,)
                )
            else:
                cursor.execute("SELECT id, doc_id, text, title FROM corpus_chunks")
            corpus_rows = cursor.fetchall()

        if not corpus_rows:
            return 0.0, []

        corpus_texts = [r[2] for r in corpus_rows]
        all_texts = corpus_texts + chunks
        vec = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            sublinear_tf=True,
            max_features=25000
        )
        tfidf_all = vec.fit_transform(all_texts)
        c_mat = tfidf_all[: len(corpus_texts)]
        q_mat = tfidf_all[len(corpus_texts) :]

        sim_matrix = cosine_similarity(q_mat, c_mat)

        matches = []
        plagiarized_chunks = 0
        for i in range(len(chunks)):
            best_idx = int(sim_matrix[i].argmax())
            best_sim = float(sim_matrix[i][best_idx])
            if best_sim >= threshold:
                plagiarized_chunks += 1
                sim_pct = round(min(100.0, best_sim * 100.0), 1)
                matches.append({
                    "original_chunk": chunks[i],
                    "matched_source": corpus_texts[best_idx],
                    "similarity_score": sim_pct,
                })

        score = round((plagiarized_chunks / len(chunks)) * 100.0, 1)
        return score, matches


# Process-level singleton
_analyzer_instance: Optional[PlagiarismAnalyzer] = None
_analyzer_lock = threading.Lock()


def get_analyzer() -> PlagiarismAnalyzer:
    global _analyzer_instance
    if _analyzer_instance is None:
        with _analyzer_lock:
            if _analyzer_instance is None:
                _analyzer_instance = PlagiarismAnalyzer()
    return _analyzer_instance
