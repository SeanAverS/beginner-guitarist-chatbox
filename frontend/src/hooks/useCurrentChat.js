import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { handleApiError, handleSuccess } from "../utils/frontEndResponses.js"
import { API_BASE_URL } from "../config.js";

// This hook: 
// Manages the chat message state and server communication
export function useCurrentChat() {
  const [messages, setMessages] = useState([]);
  const [userInput, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [chatFilename, setChatFilename] = useState(null);

  const getFirstMessage = (messages) => {
    if (messages.length === 2) { 
      return messages[0].text;
    }
    return null;
  };

  // id current chat
  useEffect(() => {
    if (!chatId) {
      setChatId(Date.now().toString()); 
    }
  }, [chatId]);

  // save latest chat state in server
   const handleSaveChat = useCallback(async (latestMessages) => {
    const messagesObject = { messages: latestMessages, chatId, chatFilename };

      const firstMessage = getFirstMessage(latestMessages);
      if (firstMessage) {
        messagesObject.firstMessage = firstMessage;
      }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/save_chat`, messagesObject);

      // store generated chat name for future saves
      if (response.data.chatFilename) {
        setChatFilename(response.data.chatFilename);
      }
      
      handleSuccess("Chat saved successfully!");
    } catch (error) {
      handleApiError(error, "Failed to save chat:", setMessages);
    }
  }, [chatId, chatFilename]);
  
  // fetch latest user, ai message and store current chat state
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (userInput.trim() === "") return;

    const userMessage = { text: userInput, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ask`, {
        prompt: userMessage.text,
      });

      const aiMessage = { text: response.data.text, sender: "ai" };
      const latestMessages = [...messages, userMessage, aiMessage];
      setMessages(latestMessages);

      // save to backend
      await handleSaveChat(latestMessages);
    } catch (error) {
      handleApiError(error, "Error sending message:", setMessages);
    } finally {
      setIsLoading(false);
    }
  };

// start a new chat
const handleNewChat = () => {
  setMessages([]);
  setInput("");
  setChatFilename(null); 
};

  return {
    messages,
    userInput,
    isLoading,
    handleSendMessage,
    setInput,
    setMessages,
    chatFilename,
    setChatFilename, 
    handleNewChat,
  };
}