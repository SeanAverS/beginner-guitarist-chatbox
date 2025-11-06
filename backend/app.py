import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from rag_service import handle_query 

app = FastAPI(title="RAG Chat API on Render")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://seanavers.github.io"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RAGRequest(BaseModel):
    query: str
    chat_filename: Optional[str] = None

@app.post("/rag")
def rag_endpoint(req: RAGRequest):
    return handle_query(req.query, chat_filename=req.chat_filename)

@app.get("/health")
def health_check():
    return {"status": "ok"}
