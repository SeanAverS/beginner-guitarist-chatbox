import ReactMarkdown from "react-markdown";
import { useCurrentChat } from "../hooks/useCurrentChat";
import { useScrollToBottom } from "../hooks/useScrollToBottom";
import { useChatSidebar } from "../hooks/useChatSidebar";
import VoiceInput from "./VoiceInput";
import { useRef, useEffect, useState } from "react"; 

// This component: 
// Renders the chatbox and its messages 
function ChatBox() {
  const { 
    messages, 
    userInput, 
    isLoading, 
    handleSendMessage, 
    setInput, 
    setMessages,
    chatFilename, 
    setChatFilename, 
    handleNewChat
  } = useCurrentChat();
  
  const { 
    savedChats, 
    isSidebarOpen, 
    setIsSidebarOpen,  
    handleLoadChat,
    handleSidebarToggle,
    handleRenameChat,
    handleDeleteChat,
  } = useChatSidebar(setMessages, setChatFilename, chatFilename, handleNewChat);

  const sidebarRef = useRef(null); 

  const chatContainerRef = useScrollToBottom(messages);
  const handleVoiceTranscript = (transcript) => {
    setInput(transcript); 
  };

    const [editingFilename, setEditingFilename] = useState(null);
    const [newTitle, setNewTitle] = useState(""); 
    
    // handle current title 
    const startRename = (filename, currentTitle) => {
      setEditingFilename(filename); 
      setNewTitle(currentTitle); 
    };

    // rename chat with new title
    const submitRename = async (e, filename) => {
        e.preventDefault(); 
        
        if (newTitle.trim()) {
            // old and new title
            await handleRenameChat(filename, newTitle); 
        }

        setEditingFilename(null);
        setNewTitle("");
    };

  const isBeingEdited = (chatFilename) => editingFilename === chatFilename;


  // Close sidebar 
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

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={handleSidebarToggle} title="Open Saved Chats">
          <i className="fa-solid fa-bars"></i>
        </button>
        <h1>Beginner Guitar Advice</h1>
      </header>

      <div
        ref={sidebarRef}
        className={`sidebar ${isSidebarOpen ? "open" : ""}`}
      >
        <div className="saved-chats-content">
          <h2>Saved Chats</h2>

          <ul>
            {savedChats.map((chat) => (
              // check if a file is being edited or not
              <li
                key={chat.filename}
                onClick={
                  isBeingEdited(chat.filename)
                    ? null
                    : () => handleLoadChat(chat.filename)
                }
                // css
                className={chat.filename === chatFilename ? "active" : ""}
              >
                {/* edit the current chat */}
                {isBeingEdited(chat.filename) ? (
                  <form
                    // submit new title to display
                    onSubmit={(e) => submitRename(e, chat.filename)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={newTitle}
                      // user input
                      onChange={(e) => setNewTitle(e.target.value)}
                      // outside click
                      onBlur={(e) => submitRename(e, chat.filename)}
                      autoFocus
                    />
                  </form>
                ) : (
                  // start new title process
                  <div className="chat-item-content">
                    <span title={chat.chatTitle}>{chat.chatTitle}</span>
                    {/*edit button */}
                    <button
                      className="rename-button"
                      title="Rename Chat"
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(chat.filename, chat.chatTitle);
                      }}
                    >
                      <i className="fa-solid fa-ellipsis"></i>
                    </button>

                    {/* delete button */}
                    <button
                      className="delete-button"
                      title="Delete Chat"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.filename);
                      }}
                    >
                      <i className="fa-solid fa-x"></i>
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <main className="chat-container" ref={chatContainerRef}>
        <div className="messages">
          {messages.map((msg, index) => {
            let messageContent;

            if (msg.sender === "ai") {
              messageContent = <ReactMarkdown>{msg.text}</ReactMarkdown>;
            } else {
              // user message
              messageContent = msg.text;
            }

            return (
              <div key={index} className={`message ${msg.sender}`}>
                {messageContent}
              </div>
            );
          })}
          {isLoading && <div className="loading-message ai">...</div>}
        </div>

        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How can I help?"
            disabled={isLoading}
          />

          <button
            type="button"
            onClick={handleNewChat}
            className="new-chat-button"
            title="New Chat"
          >
            <i className="fa-solid fa-plus"></i>
          </button>

          <VoiceInput onTranscript={handleVoiceTranscript} />
        </form>
      </main>
    </div>
  );
}

export default ChatBox;