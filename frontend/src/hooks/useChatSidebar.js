import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { handleSuccess, handleRequestError } from "../utils/frontEndResponses.js";
import { API_BASE_URL } from "../config.js";

// This hook:
// fetches the saved_chats folder content
// display the chat content of a chat
// hides the sidebar when the user clicks on a chosen chat
// hides the sidebar when the user clicks outside the sidebar
// deletes a chosen chat
export function useChatSidebar(setChosenChat, setChatFilename, chatFilename, handleNewChat) {
  const [savedChats, setSavedChats] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // fetch saved_chats folder content
  const fetchSavedChats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/get_chats`);
      setSavedChats(response.data);
      handleSuccess("Saved chats fetched:", response.data);
    } catch (error) {
      handleRequestError(error, "Failed to fetch saved chats");
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
      const response = await axios.get(`${API_BASE_URL}/api/load_chat/${filename}`);
      setChosenChat(response.data); 
      setIsSidebarOpen(false);
      setChatFilename(filename);
    } catch (error) {
      handleRequestError(error, "Failed to load chat");
    }
  };

  // rename a saved chat 
  const handleRenameChat = async (oldFilename, newTitle) => {
    // send old and new title to server
    try {
      const response = await axios.post(`${API_BASE_URL}/api/rename_chat`,
        {
          oldFilename,
          newTitle: newTitle.trim(),
        }
      );

      // refresh sidebar 
      setSavedChats(response.data);

    } catch (error) {
      handleRequestError(error, "Failed to rename chat");
    }
  };

  // delete a chat
  const handleDeleteChat = async (filename) => {
    try {
    // display saved chats that were not deleted 
    setSavedChats((prev) => prev.filter(chat => chat.filename !== filename));

        const response = await axios.delete(`${API_BASE_URL}/api/delete_chat/${filename}`);

    // make sure response contains array
    if (response?.data?.data && Array.isArray(response.data.data)) {
      setSavedChats(response.data.data);
    } else if (Array.isArray(response.data)) {
      setSavedChats(response.data);
    } else {
      setSavedChats([]); 
    }

    if (filename === chatFilename) {
      handleNewChat();
    }

  } catch (error) {
    handleRequestError(error, "Failed to delete chat");

    // re-fetch chats for sidebar consistency
    try {
      const refreshResponse = await axios.get(`${API_BASE_URL}/api/get_chats`);
      setSavedChats(Array.isArray(refreshResponse.data) ? refreshResponse.data : []);
    } catch {
      setSavedChats([]);
    }
  }
};


  const sidebarRef = useRef(null); 

  // Close sidebar on outside click
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
          setIsSidebarOpen(false);
        }
      };
  
      document.addEventListener("mousedown", handleClickOutside);
  
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [sidebarRef, setIsSidebarOpen]);

  return {
    savedChats,
    isSidebarOpen,
    setIsSidebarOpen,
    handleLoadChat,
    handleSidebarToggle,
    handleRenameChat,
    handleDeleteChat,
    sidebarRef
  };
}