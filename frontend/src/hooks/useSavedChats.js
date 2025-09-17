import { useState } from "react";
import axios from "axios";

// This hook:
// fetches the saved_chats folder content
// display the chat content of a chosen chat
export function useSavedChats(setChosenChat, setChatFilename) {
  const [savedChats, setSavedChats] = useState([]);
  const [isSavedChatsVisible, setIsSavedChatsVisible] = useState(false);

  // fetch saved_chats folder content
  const fetchSavedChats = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/get_chats");
      setSavedChats(response.data);
      console.log("Saved chats fetched:", response.data);
    } catch (error) {
      console.error("Failed to fetch saved chats:", error);
    }
  };

  // display chat chosen by user
  const handleLoadChat = async (filename) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/load_chat/${filename}`);
      setChosenChat(response.data); 
      setIsSavedChatsVisible(false);
      setChatFilename(filename);
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  };

  return {
    savedChats,
    isSavedChatsVisible,
    setIsSavedChatsVisible,
    fetchSavedChats,
    handleLoadChat,
  };
}