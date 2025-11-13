import sys

_embedder = None

def get_embedder():
    global _embedder
    if _embedder is None:
        try:
            from sentence_transformers import SentenceTransformer
        except ModuleNotFoundError:
            print("[ERROR] sentence-transformers not found — add to requirements.txt", file=sys.stderr)
            raise
        print("[embedder] Loading model...", file=sys.stderr)
        _embedder = SentenceTransformer("paraphrase-MiniLM-L3-v2")
    return _embedder
