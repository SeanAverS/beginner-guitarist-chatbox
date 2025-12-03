import json
import sys
from embedder import get_embedder
import os

# This compares the embeddings from the HNSWLIB index with an embedded user query

BASE_DIR = os.path.dirname(__file__)
INDEX_FILE = os.path.join(BASE_DIR, "chat_index.bin")
META_FILE = os.path.join(BASE_DIR, "chat_meta.json")

# lazy load hnswlib 
def get_hnswlib(): # <<< NEW
    try:
        import hnswlib
        return hnswlib
    except ModuleNotFoundError:
        print("[ERROR] HNSWlib not found — make sure it's in requirements.txt", file=sys.stderr)
        raise

class Retriever:
    _index = None
    _embedder = None
    _texts = None
    _metas = None
    _faiss = None 
    _hnsw = None 

    # load embeddings/metadata from HNSWLIB index 
    @classmethod
    def init(cls):
        if cls._hnsw is None: 
            cls._hnsw = get_hnswlib() 

        if cls._index is None:
            print("[Retriever] Loading HNSWLIB index...", file=sys.stderr)
            cls._index = cls._hnsw.Index(space='cosine', dim=384) 
            cls._index.load_index(INDEX_FILE)
            with open(META_FILE, "r", encoding="utf-8") as f: 
                meta = json.load(f)
            cls._texts = meta.get("texts", []) # text
            cls._metas = meta.get("metas", []) # filename
        if cls._embedder is None:
            cls._embedder = get_embedder()

    # load HNSWLIB before query 
    def __init__(self):
        Retriever.init()

    # embed user query and find similar HSNWLIB index content 
    def query(self, query_text, k=3): 
        query_embedding = Retriever._embedder.encode([query_text], convert_to_numpy=True).flatten()
        indices, distances = Retriever._index.knn_query(query_embedding, k=k)

        results = [] # user query

        for i in indices[0]:
            results.append({ # similar HNSWLIB index content 
                "text": Retriever._texts[i],
                "source": Retriever._metas[i]["source"]
            })
        return results
