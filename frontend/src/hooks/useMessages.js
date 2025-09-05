import { useState, useEffect } from "react";
import axios from "axios";

// This hook: 
// Manages the chat message state and server communication
export function useMessages() {
  const [messages, setMessages] = useState([]);
  const [userInput, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState(null);

  // id current chat
  useEffect(() => {
    if (!chatId) {
      setChatId(Date.now().toString()); 
    }
  }, [chatId]);

  // fetch latest user, ai message and store current chat state
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (userInput.trim() === "") return;

    const userMessage = { text: userInput, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:3001/api/ask", {
        prompt: userMessage.text,
      });

      const aiMessage = { text: response.data.text, sender: "ai" };
      const latestMessages = [...messages, userMessage, aiMessage];
      setMessages(latestMessages);

      // save to backend
      await handleSaveChat(latestMessages);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        text: "Sorry, I am unable to respond right now.",
        sender: "ai",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // save latest chat state in server
   const handleSaveChat = async (latestMessages) => {
    try {
      await axios.post("http://localhost:3001/api/save_chat", { messages: latestMessages, chatId });
      console.log("Chat saved successfully!");
    } catch (error) {
      console.error("Failed to save chat:", error);
    }
  };

  return {
    messages,
    userInput,
    isLoading,
    handleSendMessage,
    setInput,
  };
}