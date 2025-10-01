import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import cors from "cors";
import "dotenv/config";
import { promises as fs } from 'fs';
import path from 'path';
import { getSavedChatList } from "./utils/getSavedChatList.js";
import { devMessage, userMessage, successResponse } from "./utils/responses.js";
import slugify from "slugify";

// This file: 
// communicates between the frontend and Google's AI API
// saves the history of a current chat

const app = express();
app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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
    let chatData = JSON.parse(fileContent);

    return successResponse(res, chatData.messages);
  } catch (error) {
    devMessage(`Failed to load chat: ${filename}`, error);
    return userMessage(res, 404, 'Chat not found.');
  }
});


// save chat history
app.post('/api/save_chat', async (req, res) => {
  const { messages, chatId, firstMessage, chatFilename } = req.body;

    const getSavedFileName = async () => {
        if (chatFilename) {
            return chatFilename;
        }

        // empty chat
        if (!firstMessage) {
            return `chat_history_${chatId}.json`;
        }

        // ai generated title 
        try {
            const prompt = `Generate a very concise, three-word filename (lowercase, hyphenated) for the following query. Do not include a file extension. Example: "john-mayer-vs-srv".
            
            Query: ${firstMessage}`;

            const titleResult = await model.generateContent(prompt);
            const chatTitle = titleResult.response.text().trim();
            return `${chatTitle}-${chatId}.json`;
        } catch (error) {
            devMessage("Error generating title with AI:", error);
            return `chat_history_${chatId}.json`;
        }
    };
    
    const savedFileName = await getSavedFileName(); 

  // save file in saved chats folder
  const savedChatsFolder = 'saved_chats';
  const savedChatsFilePath = path.join(savedChatsFolder, savedFileName);

  try {
    // check folder existence 
    await fs.mkdir(savedChatsFolder, { recursive: true });

    // generate file name
    const chatData = {
      meta: { title: firstMessage || "New Chat" },
      messages
    };

    await fs.writeFile(savedChatsFilePath, JSON.stringify(chatData, null, 2), "utf-8");

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
    const oldFilePath = path.join(savedChatsFolder, oldFilename);

    // update old title with new title
    try {
        const fileContent = await fs.readFile(oldFilePath, 'utf-8');
        let chatData = JSON.parse(fileContent);
        chatData.meta.title = newTitle.trim();

        await fs.writeFile(oldFilePath, JSON.stringify(chatData, null, 2), "utf-8");

            // Generate new filename
    const newFileName = `${slugify(newTitle.trim(), { lower: true })}.json`;
    const newFilePath = path.join(savedChatsFolder, newFileName);

    // Rename the file
    await fs.rename(oldFilePath, newFilePath);
        
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