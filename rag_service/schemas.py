from typing import Optional
from pydantic import BaseModel


class IngestRequest(BaseModel):
    doc_id: str          # UUID from Spring Boot
    startup_id: int
    document_name: str
    file_path: str       # Absolute path to the uploaded file
    file_type: str       # pdf, docx, pptx, txt


class IngestResponse(BaseModel):
    doc_id: str
    chunks_created: int
    status: str          # "completed" or "failed"
    error: Optional[str] = None


class DeleteRequest(BaseModel):
    doc_id: str


class ChatRequest(BaseModel):
    startup_id: int
    question: str
    conversation_history: list[dict] = []  # [{role: "user/assistant", content: "..."}]


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]   # [{doc_name, page_number, excerpt, doc_id}]
    used_context: bool
    retrieved_chunks: int


class HealthResponse(BaseModel):
    status: str
    chroma_collection: str
    chroma_doc_count: int
    embedding_model: str
    llm_provider: str
