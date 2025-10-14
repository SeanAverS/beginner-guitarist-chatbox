import os
import sys
import json
import time
import faiss
from dotenv import load_dotenv
import google.generativeai as genai
from ingest import load_saved_chats, load_text_files
from query import Retriever

# This will answer the user query using FAISS index and Gemini as context 

# log output to stderr
def log(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)
    
SAVED_CHAT_LIMIT = 100

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Load FAISS 
retriever = Retriever()

# search FAISS for similar content to user query
def search_faiss(user_query, k=3):
    start = time.time()
    results = retriever.query(user_query, k)
    elapsed = (time.time() - start) * 1000  # milliseconds
    log(f"[FAISS] Retrieval took {elapsed:.2f} ms")
    return results

# count saved and remaining chats
def get_saved_chat_summary():
    saved_chats = load_saved_chats()
    total_chats = len(saved_chats)
    remaining = max(SAVED_CHAT_LIMIT - total_chats, 0)
    return saved_chats[:SAVED_CHAT_LIMIT], total_chats, remaining

# load saved chat for specific session
def get_saved_chat_for_session(chat_filename=None):
    if not chat_filename:
        return []
    folder = "saved_chats"
    path = os.path.join(folder, chat_filename)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return [(msg["text"], {"source": chat_filename}) for msg in data.get("messages", [])]

# construct answer to user query with FAISS and Gemini
def rag_answer(user_query):
    knowledge_docs = search_faiss(user_query, k=3)

    saved_chats, total_chats, remaining_chats = get_saved_chat_summary()

    # Build context using FAISS 
    context_sections = []
    if saved_chats:
        context_sections.append(f"### Saved Conversations ({len(saved_chats)} of {total_chats}):")
        for chat, meta in saved_chats:
            context_sections.append(f"{chat} (source: {meta['source']})")

    if knowledge_docs:
        context_sections.append("\n### Relevant Knowledge:")
        for doc in knowledge_docs:
            context_sections.append(f"{doc['text']} (source: {doc['source']})")

    context = "\n\n".join(context_sections)

    log("\n--- Retrieved Context for Gemini from FAISS ---")
    log(f"Saved chats: {len(saved_chats)}, Knowledge docs: {len(knowledge_docs)}")

    # Build context using Gemini 
    model = genai.GenerativeModel("gemini-2.5-flash-lite")

    # Prepare prompt with FAISS index  
    prompt = (
        "You are a beginner guitar assistant. Only use guitar-related information. Do not answer unrelated questions."
        "The answer should be short but not too short. Be friendly and patient always!\n\n"
        "If the context does not contain the answer, gracefully say you don't know about this question **then only use your own knowledge to answer.**"
        f"Context:\n{context}\n\n"
        f"Question:\n{user_query}\n\nAnswer:"
    )

    start = time.time()
    # Construct answer using Gemini and prompt (FAISS index)
    response = model.generate_content(prompt)
    elapsed = (time.time() - start)
    log(f"[Gemini] Response took {elapsed:.2f} sec")

    return response.text, knowledge_docs, total_chats, remaining_chats

# parse JSON of user's message from stdin 
def _read_query_from_stdin():
    try:
        data = sys.stdin.read()
        if not data:
            return None
        try: # parse JSON like {"query": "users question"} 
            obj = json.loads(data)
            return obj.get("query") or obj.get("q") or None
        except Exception: # plain text 
            return data.strip()
    except Exception as e:
        log(f"[ERROR] Failed to read query: {e}")
        return None

def handle_query(query, chat_filename=None):
    """Handles a query from the chatbox (frontend) or CLI."""
    try:
        answer, knowledge_docs, total_chats, remaining_chats = rag_answer(query)

        # concise format of FAISS index
        simplified_docs = []
        for d in knowledge_docs:
            text = d.get("text", "")
            first_line = text.split("\n", 1)[0].strip()
            simplified_docs.append({"title": first_line, "source": d.get("source")})

        saved_chats_list = get_saved_chat_for_session(chat_filename)
        saved_titles = [{"title": meta["source"], "source": meta["source"]}
                        for _, meta in saved_chats_list[:SAVED_CHAT_LIMIT]]

        return {
            "answer": answer,
            "knowledge_docs": simplified_docs,
            "saved_chats": saved_titles,
            "total_chats": total_chats,
            "remaining_chats": remaining_chats
        }

    except Exception as e:
        log(f"[ERROR] {e}")
        return {"error": str(e)}

# CLI testing
if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:]).strip()
    else:
        query = _read_query_from_stdin()

    if not query:
        log("No query provided")
        print(json.dumps({"error": "No query provided"}, ensure_ascii=False))
        sys.exit(1)

    result = handle_query(query)
    print(json.dumps(result, ensure_ascii=False))  # ONLY JSON to stdout
