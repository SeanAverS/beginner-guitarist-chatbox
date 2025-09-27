import Messages from "./Messages";
import MessageForm from "./MessageForm";
import { useCurrentChat } from "../hooks/useCurrentChat";
import { useScrollToBottom } from "../hooks/useScrollToBottom";
import { useChatSidebar } from "../hooks/useChatSidebar";
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
                  // non-editing mode
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
        
      <Messages messages={messages} isLoading={isLoading} />

       <MessageForm
        userInput={userInput}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        handleNewChat={handleNewChat}
        handleVoiceTranscript={handleVoiceTranscript}
        isLoading={isLoading}
        />
      </main>
    </div>
  );
}

export default ChatBox;