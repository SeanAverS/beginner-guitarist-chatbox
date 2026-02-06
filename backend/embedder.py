import google.generativeai as genai
import numpy as np
import os
import sys
from dotenv import load_dotenv

load_dotenv()

_embedder = None

class GoogleEmbedder:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("[ERROR] GOOGLE_API_KEY not found", file=sys.stderr)
        genai.configure(api_key=api_key)

    def encode(self, texts, convert_to_numpy=True):
        # Call the Google API
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=texts,
            task_type="retrieval_query"
        )
        
        data = result.get('embeddings') or result.get('embedding') or []
            
        # Convert to numpy and force 2D shape (N Rows, 768 Columns)
        arr = np.array(data).astype('float32')
        
        # Reshape Array in 2D for FAISS 
        if arr.ndim == 1:
            arr = arr.reshape(1, -1)
            
        return arr

def get_embedder():
    global _embedder
    if _embedder is None:
        print("[embedder] Loading Google Cloud Embeddings...", file=sys.stderr)
        _embedder = GoogleEmbedder()
    return _embedder