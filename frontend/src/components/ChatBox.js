import React from "react";
import ReactMarkdown from "react-markdown";
import { useMessages } from "../hooks/useMessages"; 

// This component: 
// Renders the chatbox and its messages 
function ChatBox() {
  const { messages, userInput, isLoading, handleSendMessage, setInput } = useMessages();

  return (
    <div className="App">
      <header className="App-header">
        <h1>Beginner Guitarist Advice</h1>
      </header>
      <main className="chat-container">
        <div className="messages">
          {messages.map((msg, index) => {
            let messageContent;

            if (msg.user === "ai") {
              messageContent = <ReactMarkdown>{msg.text}</ReactMarkdown>;
            } else {
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
        </form>
      </main>
    </div>
  );
}

export default ChatBox;