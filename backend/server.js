import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post("/api/ask", async (req, res) => {
  try {
    const userMessage = req.body.prompt; 

    const finalPrompt = `Provide a detailed but concise answer to the following question. Answer the user's question directly: ${userMessage}`;

    const result = await model.generateContent(finalPrompt);

    const response = await result.response;
    const text = response.text();

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