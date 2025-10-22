import os
import sys
import json
import glob
import faiss
from embedder import get_embedder

# This formats saved_chats and data folder content and organizes into a FAISS index

BASE_DIR = os.path.dirname(__file__)
INDEX_FILE = os.path.join(BASE_DIR, "chat_index.faiss")
META_FILE = os.path.join(BASE_DIR, "chat_meta.json")

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

# prepare folder data for FAISS 
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
    embeddings = embedder.encode(list(texts), convert_to_numpy=True)

    # organize embeddings for FAISS 
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    faiss.write_index(index, INDEX_FILE)
    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump({"texts": texts, "metas": metas}, f, indent=2)

    print(f"Indexed {len(texts)} items.", file=sys.stderr)

if __name__ == "__main__":
    build_index()
