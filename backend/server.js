import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import cors from "cors";
import "dotenv/config";
import { promises as fs } from 'fs';
import path from 'path';
import { getSavedChatList } from "./utils/getSavedChatList.js";
import { devMessage, userMessage, successResponse } from "./utils/responses.js";

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

    return successResponse(res, { text: aiMessage });
  } catch (error) {
    devMessage("Error generating content:", error);
    return userMessage(res, 500, "An error occurred with the AI service.");
  }
});

// get chat names for frontend display
app.get('/api/get_chats', async (req, res) => {
  try {
    const chats = await getSavedChatList();
    return successResponse(res, chats);
  } catch (error) {
    devMessage("Failed to fetch chats:", error);
    return userMessage(res, 500, 'Failed to fetch chats.');
  }
});

// load chosen chat content 
app.get('/api/load_chat/:filename', async (req, res) => {
  const filename = req.params.filename;
  const savedChatsFolder = 'saved_chats';
  const filePath = path.join(savedChatsFolder, filename);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const messages = JSON.parse(fileContent);
    return successResponse(res, messages);
  } catch (error) {
    devMessage(`Failed to load chat: ${filename}`, error);
    return userMessage(res, 404, 'Chat not found.');
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
        devMessage("Error generating title with AI:", error);
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
    return successResponse(res, { message: 'Chat history saved successfully!', chatFilename: savedFileName});
  } catch (error) {
    devMessage("Error saving chat history:", error);
    return userMessage(res, 500, 'Failed to save chat history.');
  }
});

// Rename a saved chat
app.post('/api/rename_chat', async (req, res) => {
    const { oldFilename, newTitle } = req.body;
    const savedChatsFolder = 'saved_chats';
    const filePath = path.join(savedChatsFolder, oldFilename);

    // update old title with new title
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        let chatData = JSON.parse(fileContent);

        if (chatData.length > 0) {
            const title = chatData[0]; 
            title.text = newTitle.trim();
        } else {
             return userMessage(res, 500, 'Cannot rename empty chat file');
        }

        await fs.writeFile(filePath, JSON.stringify(chatData, null, 2), 'utf-8');
        
       const updatedChats = await getSavedChatList();

      return successResponse(res, updatedChats);

    } catch (error) {
      devMessage("Failed to rename chat:", error);
      return userMessage(res, 400, 'Failed to rename or save chat.');
    }
});

// delete a chat
app.delete('/api/delete_chat/:filename', async (req, res) => {
    const filename = req.params.filename;
    const savedChatsFolder = 'saved_chats';
    const filePath = path.join(savedChatsFolder, filename);

    // delete the chosen chat
    try {
        await fs.unlink(filePath); 
        console.log(`Successfully deleted chat: ${filename}`);

        const updatedChats = await getSavedChatList(); 
        return successResponse(res, updatedChats);

    } catch (error) {
        if (error.code === "ENOENT") {
          return userMessage(res, 404, "Chat file not found.");
        }
        devMessage("Failed to delete chat:", error);
        return userMessage(res, 500, 'Failed to delete chat.');
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});