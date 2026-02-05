import os
import shutil
import subprocess
import json
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_community.vectorstores import Chroma

app = FastAPI(title="MEDRAG - Real-Time Analysis")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PERSIST_DIR = "vectordb"
COLLECTION = "medrag"

embeddings = OllamaEmbeddings(model="nomic-embed-text")
llm = OllamaLLM(model="gemma3:1b", temperature=0.2)

# Global VectorDB placeholder
vectordb = None

# --- Pydantic Models ---
class AskRequest(BaseModel):
    question: str
    top_k: int = 5

class Chunk(BaseModel):
    content: str
    source: str
    test_name: Optional[str] = None
    score: float

class AskResponse(BaseModel):
    answer: str
    chunks: List[Chunk]

# --- Routes ---

@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    # Always reload to ensure latest data is queried
    db = Chroma(persist_directory=PERSIST_DIR, embedding_function=embeddings, collection_name=COLLECTION)
    results = db.similarity_search_with_score(req.question, k=req.top_k)

    chunks = [
        Chunk(
            content=doc.page_content,
            source=doc.metadata.get("source", "unknown"),
            test_name=doc.metadata.get("test_name"),
            score=float(score)
        ) for doc, score in results
    ]

    context = "\n\n".join([c.content for c in chunks])
    prompt = f"Using this context, answer the question accurately.\n\nCONTEXT:\n{context}\n\nQUESTION:\n{req.question}\n\nANSWER:"
    
    answer = llm.invoke(prompt).strip()
    return AskResponse(answer=answer, chunks=chunks)

@app.post("/upload")
async def upload_report(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # 1. OCR -> 2. Parse -> 3. Ingest
        subprocess.run(["python", "ocr.py", "--input", temp_path, "--out", "ocr_out.json"], check=True)
        subprocess.run(["python", "parse.py", "--input", "ocr_out.json", "--out", "structured.json"], check=True)
        subprocess.run(["python", "ingest.py", "--json", "structured.json"], check=True)
        
        # 4. Read the parsed result for Real-Time UI update
        with open("structured.json", "r") as f:
            analysis_data = json.load(f)
        
        return {
            "status": "success", 
            "analysis": analysis_data 
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if os.path.exists(temp_path): os.remove(temp_path)