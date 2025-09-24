import { useState } from "react";
import axios from "axios";

// This hook:
// fetches the saved_chats folder content
// display the chat content of a chat
// hides the sidebar when the user clicks on a chosen chat
// deletes a chosen chat
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

  // rename a saved chat 
  const handleRenameChat = async (oldFilename, newTitle) => {
    // send old and new title to server
    try {
      const response = await axios.post(
        "http://localhost:3001/api/rename_chat",
        {
          oldFilename,
          newTitle: newTitle.trim(),
        }
      );

      // refresh sidebar 
      setSavedChats(response.data);

    } catch (error) {
      console.error("Failed to rename chat:", error);
      alert("Failed to rename chat. Check the console for details.");
    }
  };

  // delete a chat
  const handleDeleteChat = async (filename) => {
    try {
      if (window.confirm("Are you sure you want to delete this chat?")) {
        const response = await axios.delete(`http://localhost:3001/api/delete_chat/${filename}`);
        setSavedChats(response.data); // Update chat list
        alert("Chat deleted successfully!");
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
      alert("Failed to delete chat. Please try again.");
    }
  };

  return {
    savedChats,
    isSidebarOpen,
    setIsSidebarOpen,
    handleLoadChat,
    handleSidebarToggle,
    handleRenameChat,
    handleDeleteChat,
  };
}