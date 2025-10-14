import { API_BASE_URL } from "../config.js";

// This uses rag_service.py on a users question
export async function askRAG(query, chatFilename = null) {
  try {
    const response = await fetch(`${API_BASE_URL}/rag`, {
      method: "POST",
       headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query, chatFilename })
    });

  if (!response.ok) {
      throw new Error("Failed to fetch RAG response");
    }
    return await response.json();
  } catch (err) {
    console.error("Error in fetchRAG:", err);
    return null;
  }
}
