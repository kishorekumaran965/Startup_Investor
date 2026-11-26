"""
embeddings.py
Singleton SentenceTransformer wrapper with thread-safe lazy loading.
"""

import logging
import threading
from typing import List

logger = logging.getLogger(__name__)

_model = None
_lock = threading.Lock()


def _get_model(model_name: str):
    global _model
    if _model is None:
        with _lock:
            if _model is None:  # double-checked locking
                logger.info("Loading SentenceTransformer model: %s", model_name)
                from sentence_transformers import SentenceTransformer
                _model = SentenceTransformer(model_name)
                logger.info("Embedding model loaded successfully.")
    return _model


def encode(texts: List[str], model_name: str = "all-MiniLM-L6-v2") -> List[List[float]]:
    """
    Encode a list of text strings into embedding vectors.

    Returns a list of float lists (one per input text).
    Thread-safe; the model is loaded once and reused.
    """
    if not texts:
        return []

    model = _get_model(model_name)
    with _lock:
        embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)

    return [emb.tolist() for emb in embeddings]


def encode_single(text: str, model_name: str = "all-MiniLM-L6-v2") -> List[float]:
    """Encode a single text string into an embedding vector."""
    if not text:
        return []
    return encode([text], model_name)[0]


def preload(model_name: str = "all-MiniLM-L6-v2") -> None:
    """Eagerly load the model (call during app startup)."""
    _get_model(model_name)
