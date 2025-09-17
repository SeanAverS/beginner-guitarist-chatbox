import { useState } from "react";
import axios from "axios";

// This hook:
// fetches the saved_chats folder content
// display the chat content of a chat
// hides the sidebar when the user clicks on a chosen chat
export function useChatSidebar(setChosenChat, setChatFilename) {
  const [savedChats, setSavedChats] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

   // open or close sidebar 
  const handleSidebarToggle = () => { 
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    } else {
      fetchSavedChats();
      setIsSidebarOpen(true);
    }
  };

  // display chosen chat and close sidebar after
  const handleLoadChat = async (filename) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/load_chat/${filename}`);
      setChosenChat(response.data); 
      setIsSidebarOpen(false);
      setChatFilename(filename);
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  };

  return {
    savedChats,
    isSidebarOpen,
    setIsSidebarOpen,
    handleLoadChat,
    handleSidebarToggle,
  };
}