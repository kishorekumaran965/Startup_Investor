from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LLM
    llm_provider: str = "groq"  # groq, openai, anthropic, or "mock" for testing
    llm_model: str = "llama-3.3-70b-versatile"
    llm_api_key: str = ""
    llm_api_base: str = ""

    # Embedding
    embedding_model: str = "all-MiniLM-L6-v2"

    # ChromaDB
    chroma_persist_dir: str = "./chroma_db"
    chroma_collection: str = "ventureconnect_docs"

    # Chunking
    chunk_size: int = 800
    chunk_overlap: int = 150

    # Retrieval
    top_k: int = 5
    relevance_threshold: float = 0.35

    # Security
    internal_api_key: str = "vc-internal-secret-key-2024"

    # Upload
    max_file_size_mb: int = 50

    class Config:
        env_file = ".env"
        env_prefix = "RAG_"


settings = Settings()
