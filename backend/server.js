import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import cors from "cors";
import "dotenv/config";
import { promises as fs } from 'fs';
import path from 'path';

// This file: 
// communicates between the frontend and Google's AI API
// saves the history of a current chat

const app = express();
app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// handle chat requests and provide ai response 
app.post("/api/ask", async (req, res) => {
  try {
    const userMessage = req.body.prompt; 

    const prompt = `You are an AI specializing in guitar advice for beginners. Provide a detailed but concise answer to the following question. Answer the user's question directly: ${userMessage}`;
    const promptResult = await model.generateContent(prompt);

    const aiResponse = await promptResult.response;
    const aiMessage = aiResponse.text();

    res.json({ text: aiMessage });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "An error occurred with the AI service." });
  }
});

// save chat history
app.post('/api/save_chat', async (req, res) => {
  const { messages, chatId, firstMessage, chatFilename } = req.body;

  let savedFileName;

  // use existing chat name or generate new one
   if (chatFilename) {
     savedFileName = chatFilename;
   } else {
     if (firstMessage) {
       try {
         const prompt = `Generate a very concise, three-word filename (lowercase, hyphenated) for the following query. Do not include a file extension. Example: "john-mayer-vs-srv".
        
        Query: ${firstMessage}`;

         const titleResult = await model.generateContent(prompt);
         const chatTitle = titleResult.response.text().trim();
         savedFileName = `${chatTitle}-${chatId}.json`;
       } catch (error) {
         console.error("Error generating title with AI:", error);
         savedFileName = `chat_history_${chatId}.json`;
       }
     } else {
       savedFileName = `chat_history_${chatId}.json`;
     }
   }

  // save file in saved chats folder
  const savedChatsFolder = 'saved_chats';
  const savedChatsFilePath = path.join(savedChatsFolder, savedFileName);

  try {
    // check folder existence 
    await fs.mkdir(savedChatsFolder, { recursive: true });
    await fs.writeFile(savedChatsFilePath, JSON.stringify(messages, null, 2), 'utf-8');
    console.log(`Chat history saved to ${savedChatsFilePath}`);
    res.status(200).json({ message: 'Chat history saved successfully!', chatFilename: savedFileName});
  } catch (error) {
    console.error("Error saving chat history:", error);
    res.status(500).json({ error: 'Failed to save chat history.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});