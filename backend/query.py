try:
    # find pip install location
    output = subprocess.check_output([sys.executable, "-m", "pip", "show", "pip"], stderr=subprocess.STDOUT).decode()
    for line in output.split('\n'):
        if line.startswith('Location: '):
            site_packages = line.split('Location: ')[1].strip()
            if site_packages not in sys.path:
                sys.path.append(site_packages)
    
    # 2. common render hidden paths for Python 3.11
    extra_paths = [
        os.path.expanduser("~/.local/lib/python3.11/site-packages"),
        "/opt/render/project/src/.venv/lib/python3.11/site-packages",
        os.getcwd()
    ]
    for p in extra_paths:
        if os.path.exists(p) and p not in sys.path:
            sys.path.append(p)
except Exception:
    pass


import json
import sys
from embedder import get_embedder
import os

# This compares the embeddings from the FAISS index with an embedded user query

BASE_DIR = os.path.dirname(__file__)
INDEX_FILE = os.path.join(BASE_DIR, "chat_index.faiss")
META_FILE = os.path.join(BASE_DIR, "chat_meta.json")

# lazy load faiss
def get_faiss():
    try:
        import faiss
        return faiss
    except ModuleNotFoundError:
        print("[ERROR] FAISS not found — make sure it's in requirements.txt", file=sys.stderr)
        raise

class Retriever:
    _index = None
    _embedder = None
    _texts = None
    _metas = None
    _faiss = None  

    # load embeddings/metadata from FAISS index 
    @classmethod
    def init(cls):
        if cls._faiss is None:
            cls._faiss = get_faiss() 

        if cls._index is None:
            print("[Retriever] Loading FAISS index...", file=sys.stderr)
            cls._index = cls._faiss.read_index(INDEX_FILE)
            with open(META_FILE, "r", encoding="utf-8") as f: 
                meta = json.load(f)
            cls._texts = meta.get("texts", []) # text
            cls._metas = meta.get("metas", []) # filename
        if cls._embedder is None:
            cls._embedder = get_embedder()

    # load FAISS before query 
    def __init__(self):
        Retriever.init()

    # embed user query and find similar FAISS index content 
    def query(self, query_text, k=3): 
        query_embedding = Retriever._embedder.encode([query_text], convert_to_numpy=True)
        distances, indices = Retriever._index.search(query_embedding, k)

        results = [] # user query

        for i in indices[0]:
            results.append({ # similar FAISS index content 
                "text": Retriever._texts[i],
                "source": Retriever._metas[i]["source"]
            })
        return results
