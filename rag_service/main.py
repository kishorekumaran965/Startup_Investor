"""
main.py
VentureConnect AI – RAG Service (FastAPI)
Runs on port 8001.  Called exclusively by the Spring Boot backend (port 8080).
"""

import logging
import os
from contextlib import asynccontextmanager
from typing import Dict

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
import embeddings as embed_svc
import vector_store as vs
import document_processor as doc_proc
import llm_client
from schemas import (
    ChatRequest,
    ChatResponse,
    DeleteRequest,
    HealthResponse,
    IngestRequest,
    IngestResponse,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
)
logger = logging.getLogger("rag_service")

# ---------------------------------------------------------------------------
# In-memory conversation store  {startup_id: [{"role": ..., "content": ...}]}
# ---------------------------------------------------------------------------

_conversation_store: Dict[int, list] = {}

# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== RAG Service starting up ===")
    # 1. Pre-load embedding model
    logger.info("Pre-loading embedding model: %s", settings.embedding_model)
    embed_svc.preload(settings.embedding_model)

    # 2. Initialise ChromaDB
    logger.info("Initialising vector store …")
    vs.init_vector_store(settings.chroma_persist_dir, settings.chroma_collection)

    logger.info("=== RAG Service ready. LLM provider: %s ===", settings.llm_provider)
    yield
    logger.info("=== RAG Service shutting down ===")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="VentureConnect RAG Service",
    version="1.0.0",
    description="Internal RAG service. Not exposed to the public internet.",
    lifespan=lifespan,
)

# CORS – only allow calls from the Spring Boot backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Security dependency
# ---------------------------------------------------------------------------


async def verify_internal_key(request: Request) -> None:
    key = request.headers.get("X-Internal-Key", "")
    if key != settings.internal_api_key:
        logger.warning(
            "Unauthorized request from %s – invalid X-Internal-Key",
            request.client.host if request.client else "unknown",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Internal-Key header.",
        )


# ---------------------------------------------------------------------------
# Global error handler
# ---------------------------------------------------------------------------


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Check service logs."},
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health():
    """Public health check – no auth required (for Docker/K8s probes)."""
    stats = vs.get_collection_stats()
    return HealthResponse(
        status="ok",
        chroma_collection=stats.get("collection_name", settings.chroma_collection),
        chroma_doc_count=stats.get("count", 0),
        embedding_model=settings.embedding_model,
        llm_provider=settings.llm_provider,
    )


# ------------------------------------------------------------------
# Document endpoints
# ------------------------------------------------------------------


@app.post(
    "/documents/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_200_OK,
    tags=["Documents"],
    dependencies=[Depends(verify_internal_key)],
)
async def ingest_document(req: IngestRequest):
    """
    Extract text from a file, embed it, and store it in ChromaDB.
    Spring Boot calls this after saving an uploaded file to disk.
    """
    logger.info(
        "Ingest request: doc_id=%s startup_id=%d file=%s",
        req.doc_id,
        req.startup_id,
        req.file_path,
    )

    # Validate file exists
    if not os.path.isfile(req.file_path):
        logger.error("File not found: %s", req.file_path)
        return IngestResponse(
            doc_id=req.doc_id,
            chunks_created=0,
            status="failed",
            error=f"File not found: {req.file_path}",
        )

    # Validate file size
    file_size_mb = os.path.getsize(req.file_path) / (1024 * 1024)
    if file_size_mb > settings.max_file_size_mb:
        return IngestResponse(
            doc_id=req.doc_id,
            chunks_created=0,
            status="failed",
            error=f"File too large ({file_size_mb:.1f} MB). Max allowed: {settings.max_file_size_mb} MB.",
        )

    try:
        # 1. Extract & chunk
        chunks = doc_proc.process_document(
            file_path=req.file_path,
            file_type=req.file_type,
            document_name=req.document_name,
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
        )

        if not chunks:
            return IngestResponse(
                doc_id=req.doc_id,
                chunks_created=0,
                status="failed",
                error="No text could be extracted from the document.",
            )

        # 2. Embed
        texts = [c["text"] for c in chunks]
        embeddings = embed_svc.encode(texts, settings.embedding_model)

        # 3. Remove old version of this document (re-ingest / update scenario)
        vs.delete_document(req.doc_id)

        # 4. Store
        vs.add_document(
            doc_id=req.doc_id,
            startup_id=req.startup_id,
            document_name=req.document_name,
            chunks=chunks,
            embeddings=embeddings,
        )

        logger.info(
            "Ingested doc_id=%s — %d chunks stored.", req.doc_id, len(chunks)
        )
        return IngestResponse(
            doc_id=req.doc_id,
            chunks_created=len(chunks),
            status="completed",
        )

    except ValueError as exc:
        logger.error("Validation error during ingest: %s", exc)
        return IngestResponse(
            doc_id=req.doc_id,
            chunks_created=0,
            status="failed",
            error=str(exc),
        )
    except Exception as exc:
        logger.error("Unexpected error during ingest of %s: %s", req.doc_id, exc, exc_info=True)
        return IngestResponse(
            doc_id=req.doc_id,
            chunks_created=0,
            status="failed",
            error=f"Ingestion failed: {exc}",
        )


@app.delete(
    "/documents/delete/{doc_id}",
    tags=["Documents"],
    dependencies=[Depends(verify_internal_key)],
)
async def delete_document(doc_id: str):
    """
    Remove all vector embeddings for a document from ChromaDB.
    Spring Boot calls this when a user deletes a document.
    """
    logger.info("Delete request for doc_id=%s", doc_id)
    deleted = vs.delete_document(doc_id)
    return {"doc_id": doc_id, "chunks_deleted": deleted, "status": "deleted"}


# ------------------------------------------------------------------
# Chat endpoints
# ------------------------------------------------------------------


@app.post(
    "/chat/query",
    response_model=ChatResponse,
    tags=["Chat"],
    dependencies=[Depends(verify_internal_key)],
)
async def chat_query(req: ChatRequest):
    """
    Answer a question using RAG over the startup's uploaded documents.
    """
    logger.info(
        "Chat query: startup_id=%d question='%s'",
        req.startup_id,
        req.question[:80],
    )

    # 1. Embed the question
    query_embedding = embed_svc.encode_single(req.question, settings.embedding_model)

    # 2. Retrieve relevant chunks
    retrieved = vs.search(
        query_embedding=query_embedding,
        startup_id=req.startup_id,
        top_k=settings.top_k,
        threshold=settings.relevance_threshold,
    )
    logger.info("Retrieved %d chunks for startup_id=%d", len(retrieved), req.startup_id)

    # 3. Merge caller-supplied history with our stored history
    stored_history = _conversation_store.get(req.startup_id, [])
    effective_history = req.conversation_history if req.conversation_history else stored_history

    # 4. Generate answer
    result = llm_client.generate_answer(
        query=req.question,
        context_chunks=retrieved,
        conversation_history=effective_history,
        provider=settings.llm_provider,
        model=settings.llm_model,
        api_key=settings.llm_api_key,
        api_base=settings.llm_api_base,
    )

    # 5. Update stored conversation history
    history = _conversation_store.setdefault(req.startup_id, [])
    history.append({"role": "user", "content": req.question})
    history.append({"role": "assistant", "content": result["answer"]})
    # Keep last 20 turns to bound memory
    _conversation_store[req.startup_id] = history[-20:]

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        used_context=result["used_context"],
        retrieved_chunks=len(retrieved),
    )


@app.post(
    "/chat/clear",
    tags=["Chat"],
    dependencies=[Depends(verify_internal_key)],
)
async def clear_conversation(req: dict):
    """
    Clear the stored conversation history for a startup.
    Body: {"startup_id": int}
    """
    startup_id = req.get("startup_id")
    if startup_id is None:
        raise HTTPException(status_code=400, detail="startup_id is required.")
    _conversation_store.pop(startup_id, None)
    logger.info("Cleared conversation history for startup_id=%s", startup_id)
    return {"startup_id": startup_id, "status": "cleared"}


# ---------------------------------------------------------------------------
# Entrypoint (for running directly with `python main.py`)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
        log_level="info",
    )
