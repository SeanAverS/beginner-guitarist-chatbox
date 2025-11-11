import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import cors from "cors";
import "dotenv/config";
import { promises as fs } from 'fs';
import path from 'path';
import { getSavedChatList } from "./utils/getSavedChatList.js";
import { devMessage, userMessage, successResponse } from "./utils/responses.js";
import slugify from "slugify";
import { spawn, execFile } from "child_process";
import { fileURLToPath } from "url";

// This file: 
// communicates between the frontend and Google's AI API
// saves the history of a current chat

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  'https://seanavers.github.io', 
  'http://localhost:3000' 
];

const app = express();
app.use(express.json());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true); 
    } else {
      return callback(null, false); 
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
  optionsSuccessStatus: 204
}));


// handle chat requests and provide ai response 
app.post("/api/ask", async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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
  try {
    const { messages, chatId, firstMessage, chatFilename } = req.body;

    // ensure saved_chats folder exists
    const savedChatsFolder = 'saved_chats';
    await fs.mkdir(savedChatsFolder, { recursive: true });

    // determine filename
    let savedFileName;
    if (chatFilename) {
      savedFileName = chatFilename;
    } else if (!firstMessage) {
      savedFileName = `chat_history_${chatId}.json`;
    } else {
      // generate AI-based filename
      try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `Generate a very concise, three-word filename (lowercase, hyphenated) for the following query. Do not include a file extension. Example: "john-mayer-vs-srv".

Query: ${firstMessage}`;

        const titleResult = await model.generateContent(prompt);
        const chatTitle = titleResult.response.text().trim();
        savedFileName = `${chatTitle}-${chatId}.json`;
      } catch (err) {
        console.error("Error generating AI filename, falling back:", err);
        savedFileName = `chat_history_${chatId}.json`;
      }
    }

    // save file
    const savedChatsFilePath = path.join(savedChatsFolder, savedFileName);
    const chatData = {
      meta: { title: firstMessage || "New Chat" },
      messages
    };

    await fs.writeFile(savedChatsFilePath, JSON.stringify(chatData, null, 2), 'utf-8');
    console.log(`Chat history saved to ${savedChatsFilePath}`);

    // always send Access-Control-Allow-Origin header
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ message: 'Chat history saved successfully!', chatFilename: savedFileName });

  } catch (err) {
    console.error("Error in /api/save_chat:", err);
    // ensure CORS header even on error
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'Failed to save chat history', details: err.message });
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

app.post("/debug-rag", async (req, res) => {
  try {
    const query = req.body.query || "Hello, how are you?";
    const python = spawn("python3", ["rag_service.py"]);

    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    python.on("close", (code) => {
      res.json({
        code,
        stdout: output,
        stderr: errorOutput,
      });
    });

    // send JSON input to Python
    python.stdin.write(JSON.stringify({ query }));
    python.stdin.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RAG: format query for frontend 
app.post("/rag", async (req, res) => {
  try {

    const userQuery = req.body.query;
    const chatFilename = req.body.chat_filename;

    if (!userQuery) {
      return res.status(400).json({ error: "No query provided" });
    }

// Use system Python on Render, otherwise use local venv
    const PYTHON_EXECUTABLE = process.env.RENDER
      ? "/usr/bin/python3" // system Python on Render
      : path.join(process.cwd(), "venv/bin/python3"); // local venv
    const RAG_SCRIPT = path.resolve(__dirname, "rag_service.py");

    const python = spawn(PYTHON_EXECUTABLE, ["-u", RAG_SCRIPT], {
      stdio: ["pipe", "pipe", "pipe"]
    });


    let ragOutput = "";
    let errorString = "";

    // send query and chat_filename to rag_service.py
    python.stdin.write(JSON.stringify({ query: userQuery, chat_filename: chatFilename }));
    python.stdin.end();

    // response from rag_service.py (JSON)
    python.stdout.on("data", (data) => {
      console.log("🐍 Python output:", data.toString());
      ragOutput += data.toString();
    });

    // errors from rag_service.py (JSON)
    python.stderr.on("data", (data) => {
      console.log("⚠️ Python error:", data.toString());
      errorString += data.toString();
    });

    // format JSON from rag_service.py for frontend display
    python.on("close", (code) => {
      if (errorString) console.error("Python RAG error:", errorString);

      try {
        const response = JSON.parse(ragOutput);
        res.json(response); // for frontend display
      } catch (err) {
        console.error("Error parsing Python response:", err);
        console.error("Full Python output:", ragOutput);
        res.status(500).json({ error: "Failed to parse Python response" });
      }
    });

    

  } catch (err) {
    console.error("Error running Python RAG service:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

import { exec } from "child_process";

// Simple ping route
app.get("/ping", (req, res) => {
  res.send("pong");
});

// Python test route
app.get("/python-test", (req, res) => {
  const PYTHON_EXECUTABLE = process.env.RENDER ? "/usr/bin/python3" : "venv/bin/python3";
  exec(`${PYTHON_EXECUTABLE} -c 'print("Python works!")'`, (error, stdout, stderr) => {
    if (error) return res.status(500).send(`Error: ${error.message}`);
    if (stderr) return res.status(500).send(`Stderr: ${stderr}`);
    res.send(stdout);
  });
});



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});