import { API_BASE_URL } from "../config.js";

// This uses rag_service.py on a users question
export async function askRAG(query, chatFilename = null) {
  // handle long Render cold start
  const controller = new AbortController();
  const renderTimeOut = setTimeout(() => controller.abort(), 90000); // 90 seconds   

  try {
    const response = await fetch(`${API_BASE_URL}/rag`, {
      method: "POST",
       headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query, chat_filename: chatFilename  }),
      signal: controller.signal
    });

    clearTimeout(renderTimeOut); // when fetch successful 

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch RAG response");
    }
    return await response.json();

  } catch (err) {
    if (err.name === 'AbortError') { // controller error message 
      console.error("Request timed out - Server is waking up");
    } else {
      console.error("Error in askRAG:", err);
    }
    return null;
  }
}
