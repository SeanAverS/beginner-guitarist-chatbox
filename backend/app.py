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

@app.get("/")
def read_root():
    return {"message": "Guitar RAG API is running!"}

@app.get("/api/get_chats")
async def get_chats():
    return []

@app.post("/api/save_chat")
async def save_chat(data: dict):
    return {"message": "Chat history saved successfully!", "chatFilename": "placeholder.json"}

@app.get("/api/load_chat/{chatFile}")
async def load_chat(chatFile: str):
    return {"messages": []}

@app.post("/api/rename_chat")
async def rename_chat(data: dict):
    return [] 

@app.delete("/api/delete_chat/{filename}")
async def delete_chat(filename: str):
    return [] 

@app.post("/api/ask")
async def ask_placeholder(data: dict):
    return {"text": "This endpoint is deprecated. Use /rag instead."}