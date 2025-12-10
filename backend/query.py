import json
import sys
from embedder import get_embedder
import os

# This compares the embeddings from the vector index with an embedded user query

BASE_DIR = os.path.dirname(__file__)
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db_data") # <<< NEW PATH

# lazy load chromadb client 
def get_chroma_client(): 
    try:
        # PersistentClient for file-backed, pure-Python index
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        return client
    except Exception as e:
        print(f"[ERROR] ChromaDB initialization failed: {e}", file=sys.stderr)
        raise

class Retriever:
    _embedder = None
    _collection = None # 
    _texts = None 
    _metas = None
    
    # load embeddings/metadata from vector index 
    @classmethod
    def init(cls):
        if cls._collection is None:
            client = get_chroma_client()
            COLLECTION_NAME = "chat_rag_collection" 
            print("[Retriever] Loading Vector Index...", file=sys.stderr)
            
            # Load existing collection created by ingest script
            cls._collection = client.get_collection(name=COLLECTION_NAME) 

            # note: Chroma stores text and metadata internally, 
            # so the separate loading of META_FILE is no longer necessary.
            
        if cls._embedder is None:
            cls._embedder = get_embedder()

    # load vector index before query 
    def __init__(self):
        Retriever.init()

    # embed user query and find similar vector index content 
    def query(self, query_text, k=3): 
        # ChromaDB API retrieval
        results = Retriever._collection.query(
            query_texts=[query_text],
            n_results=k,
            include=['documents', 'metadatas']
        )

        final_results = [] # user query
        
        # Format Chroma results 
        if results and results.get('documents') and results.get('metadatas'):
            for doc, meta in zip(results['documents'][0], results['metadatas'][0]):
                final_results.append({ 
                    "text": doc,
                    "source": meta["source"]
                })
        
        return final_results