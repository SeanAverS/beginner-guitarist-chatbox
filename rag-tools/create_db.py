import os
import chromadb
from chromadb.utils import embedding_functions

# Step 1: Initialize the ChromaDB client
chroma_client = chromadb.Client()

# Step 2: Set up the embedding model
# We will use a model from the sentence-transformers library
ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

# Step 3: Get or create a collection
# A collection is where your documents will be stored
collection_name = "guitar_knowledge_rag"
collection = chroma_client.get_or_create_collection(
    name=collection_name,
    embedding_function=ef
)

# Step 4: Read and process the data files
# This code will read all your .txt files from the `data` directory
data_path = os.path.join(os.path.dirname(__file__), "..", "data")
documents = []
metadatas = []
ids = []
doc_id = 0

print("Processing documents...")
for filename in os.listdir(data_path):
    if filename.endswith(".txt"):
        with open(os.path.join(data_path, filename), "r") as f:
            content = f.read()
            # Split the content into sections based on the "Title:" marker
            sections = content.strip().split("\n\n")
            for section in sections:
                parts = section.split("\n", 1)
                if len(parts) == 2:
                    title_part = parts[0].strip()
                    content_part = parts[1].strip()
                    documents.append(content_part)
                    metadatas.append({"filename": filename, "title": title_part})
                    ids.append(f"doc_{doc_id}")
                    doc_id += 1

# Step 5: Add documents to the ChromaDB collection
print(f"Adding {len(documents)} documents to the database...")
collection.add(
    documents=documents,
    metadatas=metadatas,
    ids=ids
)

print(f"Successfully added {len(documents)} documents to the '{collection_name}' collection.")
print("The vector database is ready!")
