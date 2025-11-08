import sys
from sentence_transformers import SentenceTransformer

_embedder = None

def get_embedder():
    global _embedder
    if _embedder is None:
        print("[embedder] Loading model...", file=sys.stderr)
        _embedder = SentenceTransformer("paraphrase-MiniLM-L3-v2")
    return _embedder
