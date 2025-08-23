import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import cors from "cors";
import "dotenv/config";

import { ChromaClient } from "chromadb";

const chromaClient = new ChromaClient();
const collectionName = "guitar_knowledge_rag";
let collection;

async function initializeChromaDB() {
  try {
    collection = await chromaClient.getCollection({ name: collectionName });
    console.log(`Successfully connected to ChromaDB collection: ${collectionName}`);
  } catch (error) {
    console.error("Error connecting to ChromaDB:", error);
  }
}
initializeChromaDB();

const app = express();
app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post("/api/ask", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    
     // Retrieve relevant /data folder contents 
    let ragContext = "";

    if (collection) {
      const results = await collection.query({
        queryTexts: [prompt],
        nResults: 2, 
      });
      
      ragContext = results.documents[0].join(" ");
    }
    
    // combine ai, relevant /data folder contents 
    const finalPrompt = `
      You are a chatbot that specializes in giving guitar advice. Use the following guitar knowledge to answer the user's question.
      If the provided knowledge does not contain the answer, say "Sorry, I can only provide guitar advice. I don't have enough knowledge about that." Do not make up any information.
      
      Guitar Knowledge:
      ${ragContext}
      
      User's question: ${prompt}
    `;
    
    const result = await model.generateContent(finalPrompt);

    const response = await result.response;
    const text = response.text(); // combined content

    res.json({ text });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "An error occurred with the AI service." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});