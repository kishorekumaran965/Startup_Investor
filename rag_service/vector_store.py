"""
vector_store.py
ChromaDB operations for the VentureConnect RAG service.
All documents share ONE collection; startup-level isolation is enforced
via metadata filters on every query.
"""

import logging
from typing import List, Dict, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

logger = logging.getLogger(__name__)

_client: Optional[chromadb.PersistentClient] = None
_collection = None


# ---------------------------------------------------------------------------
# Initialisation
# ---------------------------------------------------------------------------

def init_vector_store(persist_dir: str, collection_name: str) -> None:
    """
    Create (or open) the persistent ChromaDB client and collection.
    Call this once during application startup.
    """
    global _client, _collection

    logger.info("Initialising ChromaDB at '%s', collection='%s'", persist_dir, collection_name)
    _client = chromadb.PersistentClient(
        path=persist_dir,
        settings=ChromaSettings(anonymized_telemetry=False),
    )
    _collection = _client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )
    logger.info(
        "ChromaDB ready. Collection '%s' has %d existing items.",
        collection_name,
        _collection.count(),
    )


def _require_collection():
    if _collection is None:
        raise RuntimeError("Vector store is not initialised. Call init_vector_store() first.")
    return _collection


# ---------------------------------------------------------------------------
# Write operations
# ---------------------------------------------------------------------------

def add_document(
    doc_id: str,
    startup_id: int,
    document_name: str,
    chunks: List[Dict],
    embeddings: List[List[float]],
) -> None:
    """
    Upsert all chunks for a document into the collection.

    Each item is stored with an ID of the form ``{doc_id}_{chunk_index}``
    and metadata fields: doc_id, startup_id, document_name, page_number, chunk_index.
    """
    col = _require_collection()

    if not chunks:
        logger.warning("add_document called with zero chunks for doc_id=%s", doc_id)
        return

    ids: List[str] = []
    documents: List[str] = []
    metadatas: List[Dict] = []
    embeds: List[List[float]] = []

    for chunk, embedding in zip(chunks, embeddings):
        chunk_id = f"{doc_id}_{chunk['chunk_index']}"
        ids.append(chunk_id)
        documents.append(chunk["text"])
        metadatas.append(
            {
                "doc_id": doc_id,
                "startup_id": startup_id,
                "document_name": document_name,
                "page_number": chunk.get("page_number", 1),
                "chunk_index": chunk["chunk_index"],
            }
        )
        embeds.append(embedding)

    col.upsert(ids=ids, embeddings=embeds, documents=documents, metadatas=metadatas)
    logger.info("Upserted %d chunks for doc_id=%s (startup_id=%d)", len(ids), doc_id, startup_id)


# ---------------------------------------------------------------------------
# Read operations
# ---------------------------------------------------------------------------

def search(
    query_embedding: List[float],
    startup_id: int,
    top_k: int = 5,
    threshold: float = 0.35,
) -> List[Dict]:
    """
    Semantic search within the given startup's documents.

    Returns a list of result dicts sorted by relevance (highest first):
        {
            "text": str,
            "doc_id": str,
            "document_name": str,
            "page_number": int,
            "chunk_index": int,
            "score": float,     # cosine similarity (0–1)
        }

    Only results with score >= threshold are returned.
    """
    col = _require_collection()

    if col.count() == 0:
        return []

    # ChromaDB cosine distance = 1 - cosine_similarity
    results = col.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k * 2, max(col.count(), 1)),  # over-fetch, then filter
        where={"startup_id": {"$eq": startup_id}},
        include=["documents", "metadatas", "distances"],
    )

    hits: List[Dict] = []
    documents_list = results.get("documents") or [[]]
    metadatas_list = results.get("metadatas") or [[]]
    distances_list = results.get("distances") or [[]]

    for doc, meta, dist in zip(
        documents_list[0], metadatas_list[0], distances_list[0]
    ):
        similarity = 1.0 - dist  # convert cosine distance → similarity
        if similarity >= threshold:
            hits.append(
                {
                    "text": doc,
                    "doc_id": meta.get("doc_id", ""),
                    "document_name": meta.get("document_name", ""),
                    "page_number": meta.get("page_number", 1),
                    "chunk_index": meta.get("chunk_index", 0),
                    "score": round(similarity, 4),
                }
            )

    # Sort descending by score and trim to top_k
    hits.sort(key=lambda x: x["score"], reverse=True)
    return hits[:top_k]


# ---------------------------------------------------------------------------
# Delete operations
# ---------------------------------------------------------------------------

def delete_document(doc_id: str) -> int:
    """
    Delete all chunks whose metadata.doc_id == doc_id.
    Returns the number of items deleted.
    """
    col = _require_collection()

    # First, find all chunk IDs for this document
    existing = col.get(where={"doc_id": {"$eq": doc_id}}, include=[])
    ids_to_delete: List[str] = existing.get("ids") or []

    if ids_to_delete:
        col.delete(ids=ids_to_delete)
        logger.info("Deleted %d chunks for doc_id=%s", len(ids_to_delete), doc_id)
    else:
        logger.warning("No chunks found for doc_id=%s — nothing deleted.", doc_id)

    return len(ids_to_delete)


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

def get_collection_stats() -> Dict:
    """Return basic stats about the collection."""
    if _collection is None:
        return {"status": "not_initialised", "count": 0}

    return {
        "status": "ready",
        "collection_name": _collection.name,
        "count": _collection.count(),
    }
