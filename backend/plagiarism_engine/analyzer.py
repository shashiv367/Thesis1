import chromadb
from sentence_transformers import SentenceTransformer


class PlagiarismAnalyzer:
    def __init__(self, db_path="./chroma_db", collection_name="thesis_corpus"):
        # Initialize the local ChromaDB vector store
        self.chroma_client = chromadb.PersistentClient(path=db_path)
        self.collection = self.chroma_client.get_or_create_collection(
            name=collection_name
        )

        # Load a lightweight, fast semantic embedding model
        # This converts text chunks into dense vectors
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def chunk_text(self, text, chunk_size=150):
        """Splits the document into smaller semantic chunks (e.g., ~150 words)."""
        words = text.split()
        return [
            " ".join(words[i : i + chunk_size])
            for i in range(0, len(words), chunk_size)
        ]

    def index_document(self, doc_id, text, metadata=None):
        """Vectorizes and stores a document in the vector database to build the corpus."""
        chunks = self.chunk_text(text)
        if not chunks:
            return

        embeddings = self.model.encode(chunks).tolist()

        ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [metadata or {"doc_id": doc_id} for _ in chunks]

        self.collection.add(
            embeddings=embeddings, documents=chunks, metadatas=metadatas, ids=ids
        )

    def check_plagiarism(self, text, threshold=0.85):
        """
        Queries the vector DB for semantic matches.
        Returns a percentage score and a list of matched text segments.
        """
        chunks = self.chunk_text(text)
        if not chunks:
            return 0.0, []

        embeddings = self.model.encode(chunks).tolist()

        # Search the vector DB for the closest match for each chunk
        results = self.collection.query(query_embeddings=embeddings, n_results=1)

        total_chunks = len(chunks)
        plagiarized_chunks = 0
        matches = []

        # Calculate semantic matches
        if results.get("distances"):
            for i, distance_list in enumerate(results["distances"]):
                if distance_list:
                    # For L2 distance, lower is more similar.
                    # We normalize this to a rough 0-1 similarity score.
                    similarity = 1.0 / (1.0 + distance_list[0])

                    if similarity > threshold:
                        plagiarized_chunks += 1
                        matches.append(
                            {
                                "original_chunk": chunks[i],
                                "matched_source": results["documents"][i][0],
                                "similarity_score": round(similarity * 100, 2),
                            }
                        )

        score = (plagiarized_chunks / total_chunks) * 100
        return round(score, 2), matches
