import json
import faiss
from embedder import get_embedder

# This compares the embeddings from the FAISS index with an embedded user query

INDEX_FILE = "chat_index.faiss"
META_FILE = "chat_meta.json"

class Retriever:
    _index = None
    _embedder = None
    _texts = None
    _metas = None

    # load embeddings/metadata from FAISS index 
    @classmethod
    def init(cls):
        if cls._index is None:
            print("[Retriever] Loading FAISS index...")
            cls._index = faiss.read_index(INDEX_FILE) 
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
