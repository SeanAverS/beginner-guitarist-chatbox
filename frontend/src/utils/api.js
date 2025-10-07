// This uses rag_service.py on a users question
export async function askRAG(query) {
  try {
    const response = await fetch("http://localhost:3001/rag", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error("Failed to fetch RAG response");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error in fetchRAG:", err);
    return null;
  }
}
