"""
document_processor.py
Extracts text from PDF, DOCX, PPTX, and TXT files, then chunks the text
with overlap while preserving page/slide numbers.
"""

import logging
import re
from pathlib import Path
from typing import List, Dict

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clean_text(text: str) -> str:
    """Remove excessive whitespace and non-printable characters."""
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)
    text = re.sub(r"\r\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


def _chunk_text(
    text: str,
    page_number: int,
    source: str,
    chunk_size: int,
    chunk_overlap: int,
) -> List[Dict]:
    """
    Split *text* into overlapping chunks.
    Tries to split on sentence boundaries first; falls back to character-based.
    Returns a list of dicts with keys: text, page_number, source.
    """
    if not text.strip():
        return []

    # Try sentence-aware splitting
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks: List[Dict] = []
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) + 1 <= chunk_size:
            current = (current + " " + sentence).strip() if current else sentence
        else:
            if current:
                chunks.append({"text": current, "page_number": page_number, "source": source})
            # If a single sentence is longer than chunk_size, force-split it
            if len(sentence) > chunk_size:
                for i in range(0, len(sentence), chunk_size - chunk_overlap):
                    part = sentence[i : i + chunk_size]
                    if part.strip():
                        chunks.append({"text": part.strip(), "page_number": page_number, "source": source})
                current = ""
            else:
                # Carry overlap from the previous chunk
                if chunks:
                    prev_words = chunks[-1]["text"].split()
                    overlap_text = " ".join(prev_words[-(chunk_overlap // 10 or 5) :])
                    current = (overlap_text + " " + sentence).strip()
                else:
                    current = sentence

    if current:
        chunks.append({"text": current, "page_number": page_number, "source": source})

    return chunks


# ---------------------------------------------------------------------------
# Extractors
# ---------------------------------------------------------------------------

def _extract_pdf(file_path: str, chunk_size: int, chunk_overlap: int) -> List[Dict]:
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise ImportError("PyMuPDF is required for PDF extraction. Install it with: pip install PyMuPDF")

    chunks: List[Dict] = []
    source = Path(file_path).name
    try:
        doc = fitz.open(file_path)
        for page_num, page in enumerate(doc, start=1):
            text = page.get_text("text")  # type: ignore[attr-defined]
            text = _clean_text(text)
            if text:
                chunks.extend(_chunk_text(text, page_num, source, chunk_size, chunk_overlap))
        doc.close()
    except Exception as exc:
        logger.error("PDF extraction failed for %s: %s", file_path, exc)
        raise

    return chunks


def _extract_docx(file_path: str, chunk_size: int, chunk_overlap: int) -> List[Dict]:
    try:
        from docx import Document
    except ImportError:
        raise ImportError("python-docx is required. Install it with: pip install python-docx")

    chunks: List[Dict] = []
    source = Path(file_path).name
    PARAGRAPHS_PER_PAGE = 40  # Heuristic estimate

    try:
        doc = Document(file_path)
        page_text = ""
        para_count = 0
        page_num = 1

        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue
            page_text += " " + text
            para_count += 1
            if para_count >= PARAGRAPHS_PER_PAGE:
                cleaned = _clean_text(page_text)
                if cleaned:
                    chunks.extend(_chunk_text(cleaned, page_num, source, chunk_size, chunk_overlap))
                page_text = ""
                para_count = 0
                page_num += 1

        # Remaining text
        if page_text.strip():
            cleaned = _clean_text(page_text)
            if cleaned:
                chunks.extend(_chunk_text(cleaned, page_num, source, chunk_size, chunk_overlap))

    except Exception as exc:
        logger.error("DOCX extraction failed for %s: %s", file_path, exc)
        raise

    return chunks


def _extract_pptx(file_path: str, chunk_size: int, chunk_overlap: int) -> List[Dict]:
    try:
        from pptx import Presentation
    except ImportError:
        raise ImportError("python-pptx is required. Install it with: pip install python-pptx")

    chunks: List[Dict] = []
    source = Path(file_path).name

    try:
        prs = Presentation(file_path)
        for slide_num, slide in enumerate(prs.slides, start=1):
            slide_text_parts = []
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text.strip():
                    slide_text_parts.append(shape.text.strip())
            combined = "\n".join(slide_text_parts)
            cleaned = _clean_text(combined)
            if cleaned:
                chunks.extend(_chunk_text(cleaned, slide_num, source, chunk_size, chunk_overlap))

    except Exception as exc:
        logger.error("PPTX extraction failed for %s: %s", file_path, exc)
        raise

    return chunks


def _extract_txt(file_path: str, chunk_size: int, chunk_overlap: int) -> List[Dict]:
    source = Path(file_path).name
    chunks: List[Dict] = []

    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
        cleaned = _clean_text(text)
        if cleaned:
            # Split on double newlines to simulate pages
            sections = re.split(r"\n{2,}", cleaned)
            page_num = 1
            page_text = ""
            for section in sections:
                page_text += "\n\n" + section
                if len(page_text) > chunk_size * 3:
                    chunks.extend(_chunk_text(page_text.strip(), page_num, source, chunk_size, chunk_overlap))
                    page_text = ""
                    page_num += 1
            if page_text.strip():
                chunks.extend(_chunk_text(page_text.strip(), page_num, source, chunk_size, chunk_overlap))

    except Exception as exc:
        logger.error("TXT extraction failed for %s: %s", file_path, exc)
        raise

    return chunks


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def process_document(
    file_path: str,
    file_type: str,
    document_name: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150,
) -> List[Dict]:
    """
    Extract text from a document file and return a list of chunks.

    Each chunk is a dict:
        {
            "text": str,
            "page_number": int,
            "chunk_index": int,
            "source": str,       # file basename (== document_name)
        }

    Raises ValueError on unsupported file type.
    Raises RuntimeError wrapping the underlying extraction error.
    """
    file_type = file_type.lower().lstrip(".")

    extractor_map = {
        "pdf": _extract_pdf,
        "docx": _extract_docx,
        "pptx": _extract_pptx,
        "txt": _extract_txt,
        "text": _extract_txt,
    }

    if file_type not in extractor_map:
        raise ValueError(f"Unsupported file type: '{file_type}'. Supported: {list(extractor_map.keys())}")

    logger.info("Processing %s document: %s", file_type.upper(), file_path)

    try:
        raw_chunks = extractor_map[file_type](file_path, chunk_size, chunk_overlap)
    except Exception as exc:
        raise RuntimeError(f"Extraction failed for '{file_path}': {exc}") from exc

    # Annotate chunk_index and ensure source matches document_name
    result: List[Dict] = []
    for idx, chunk in enumerate(raw_chunks):
        result.append(
            {
                "text": chunk["text"],
                "page_number": chunk["page_number"],
                "chunk_index": idx,
                "source": document_name,
            }
        )

    logger.info(
        "Extracted %d chunks from '%s' (type=%s)", len(result), document_name, file_type
    )
    return result
