import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["FAISS_VERBOSE"] = "0"

import sys
import json
import faiss
import google.generativeai as genai
from dotenv import load_dotenv
from ingest import load_saved_chats, load_text_files
from query import Retriever
import time

# Send logs to stderr only
def log(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

SAVED_CHAT_LIMIT = 100

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

retriever = Retriever()

def search_faiss(user_query, k=3):
    start = time.time()
    results = retriever.query(user_query, k)
    elapsed = (time.time() - start) * 1000
    log(f"[FAISS] Retrieval took {elapsed:.2f} ms")
    return results

def get_saved_chat_summary():
    saved_chats = load_saved_chats()
    total_chats = len(saved_chats)
    remaining = max(SAVED_CHAT_LIMIT - total_chats, 0)
    return saved_chats[:SAVED_CHAT_LIMIT], total_chats, remaining

def rag_answer(user_query):
    knowledge_docs = search_faiss(user_query, k=3)
    saved_chats, total_chats, remaining_chats = get_saved_chat_summary()

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
    log("\n--- Retrieved Context for Gemini from FAISS---")
    if saved_chats:
        log(f"{len(saved_chats)} saved chats:")
        for _, meta in saved_chats:
            log(f"- {meta['source']}")
    else:
        log("No saved chats included.")
    if knowledge_docs:
        log(f"{len(knowledge_docs)} data files:")
        for doc in knowledge_docs:
            log(f"- {doc['source']}")

    model = genai.GenerativeModel("gemini-2.5-flash-lite")
    prompt = (
        f"Answer the following question using the provided context.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {user_query}\n\nAnswer:"
    )

    start = time.time()
    response = model.generate_content(prompt)
    elapsed = (time.time() - start)
    log(f"[Gemini] Response took {elapsed:.2f} sec")

    return response.text, knowledge_docs, total_chats, remaining_chats

def _read_query_from_stdin():
    try:
        data = sys.stdin.read()
        if not data:
            return None
        try:
            obj = json.loads(data)
            return obj.get("query") or obj.get("q") or None
        except Exception:
            return data.strip()
    except Exception as e:
        log(f"[ERROR] Failed to read query: {e}")
        return None

def handle_query(query):
    try:
        answer, knowledge_docs, total_chats, remaining_chats = rag_answer(query)

        simplified_docs = []
        for d in knowledge_docs:
            text = d.get("text", "")
            first_line = text.split("\n", 1)[0].strip()
            simplified_docs.append({"title": first_line, "source": d.get("source")})

        saved_chats = load_saved_chats()
        saved_titles = [{"title": meta["source"], "source": meta["source"]}
                        for _, meta in saved_chats[:SAVED_CHAT_LIMIT]]

        return {
            "answer": answer,
            "knowledge_docs": simplified_docs,
            "saved_chats": saved_titles,
            "total_chats": total_chats,
            "remaining_chats": remaining_chats
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:]).strip()
    else:
        query = _read_query_from_stdin()

    if not query:
        print(json.dumps({"error": "No query provided"}, ensure_ascii=False), file=sys.stdout)
        sys.exit(1)

    result = handle_query(query)
    print(json.dumps(result, ensure_ascii=False), file=sys.stdout)
