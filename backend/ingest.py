import os
import sys
import json
import glob
from embedder import get_embedder
import numpy as np

# This formats saved_chats and data folder content and organizes into a vector index

BASE_DIR = os.path.dirname(__file__)
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db_data") 
COLLECTION_NAME = "chat_rag_collection" 

# lazy load chromadb client 
def get_chroma_client(): 
    try:
        import chromadb 
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        return client
    except ModuleNotFoundError:
        print("[ERROR] chromadb not found — check requirements.txt", file=sys.stderr)
        raise
    except Exception as e:
        print(f"[ERROR] ChromaDB initialization failed: {e}", file=sys.stderr)
        raise

# get AI messages from saved chats folder
def load_saved_chats(folder="saved_chats"):
    docs = []
    if not os.path.exists(folder):
        return docs

    for file in os.listdir(folder):
        if file.endswith(".json"):
            with open(os.path.join(folder, file), "r", encoding="utf-8") as f:
                # get ai messages
                try:
                    chat = json.load(f)
                    for msg in chat.get("messages", []):
                        if msg["sender"] == "ai":
                            docs.append((msg["text"], {"source": file}))
                except Exception as e:
                    print(f"Error reading {file}: {e}", file=sys.stderr)
    return docs

# get text from data folder
def load_text_files(folder="data"):
    docs = []
    if not os.path.exists(folder):
        return docs

    for file in glob.glob(os.path.join(folder, "*.txt")):
        with open(file, "r", encoding="utf-8") as f:
            text = f.read().strip()
            entries = text.split("\n\n") 
            # get "Title" and "Content" text 
            for entry in entries:
                if "Title:" in entry and "Content:" in entry:
                    title = entry.split("Title:")[1].split("Content:")[0].strip()
                    content = entry.split("Content:")[1].strip()
                    combined = f"{title}\n{content}"
                    docs.append((combined, {"source": os.path.basename(file)}))
    return docs

# prepare folder data for vector index 
def build_index():
    embedder = get_embedder()

    chat_docs = load_saved_chats()
    text_docs = load_text_files()

    docs = chat_docs + text_docs
    if not docs:
        print("No documents found.", file=sys.stderr)
        return
    
    # prepare embeddings 
    texts, metas = zip(*docs) # text, filename
    
    # Generate unique IDs for ChromaDB
    ids = [f"doc_{i}" for i in range(len(texts))]

    embeddings = embedder.encode(list(texts), convert_to_numpy=True).tolist() 

    # Initialize Chroma client and collection
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = client.get_or_create_collection(name=COLLECTION_NAME)
    
    # Add data points to ChromaDB
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=list(texts),
        metadatas=list(metas)
    )

    print(f"Indexed {len(texts)} items.", file=sys.stderr)

if __name__ == "__main__":
    # Ensure ingest script creates index before the server tries to load it
    build_index()