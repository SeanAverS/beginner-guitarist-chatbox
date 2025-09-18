import ReactMarkdown from "react-markdown";
import { useCurrentChat } from "../hooks/useCurrentChat";
import { useScrollToBottom } from "../hooks/useScrollToBottom";
import { useChatSidebar } from "../hooks/useChatSidebar";
import VoiceInput from "./VoiceInput";
import { useRef, useEffect } from "react"; 

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
    setChatFilename, 
    handleNewChat
  } = useCurrentChat();
  
  const { 
    savedChats, 
    isSidebarOpen, 
    setIsSidebarOpen,  
    handleLoadChat,
    handleSidebarToggle
  } = useChatSidebar(setMessages, setChatFilename);

  const sidebarRef = useRef(null); 

  const chatContainerRef = useScrollToBottom(messages);
  const handleVoiceTranscript = (transcript) => {
    setInput(transcript); 
  };

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
        <button onClick={handleSidebarToggle}>
           <i className="fa-solid fa-bars"></i>
        </button>
        <h1>Beginner Guitar Advice</h1>
      </header>

      <div ref={sidebarRef} className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="saved-chats-content">
          <h2>Saved Chats</h2>
          <ul>
            {savedChats.map((chat) => (
              <li 
                key={chat.filename} 
                onClick={() => handleLoadChat(chat.filename)}
              >
                {chat.firstMessage}
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
            } else { // user message
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
        
        <form 
          className="message-form" 
          onSubmit={handleSendMessage}
        >
          <input
            type="text"
            value={userInput}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How can I help?"
            disabled={isLoading}
          />

           <button type="button" onClick={handleNewChat} className="new-chat-button">
      <i className="fa-solid fa-plus"></i>
    </button>

          <VoiceInput onTranscript={handleVoiceTranscript} />
        </form>
      </main>
    </div>
  );
}

export default ChatBox;