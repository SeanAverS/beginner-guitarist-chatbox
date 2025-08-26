import React from "react";
import ReactMarkdown from "react-markdown";
import { useMessages } from "../hooks/useMessages"; 

function ChatBox() {
  const { messages, input, isLoading, handleSendMessage, setInput } = useMessages();

  return (
    <div className="App">
      <header className="App-header">
        <h1>Beginner Guitarist Advice</h1>
      </header>
      <main className="chat-container">
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.user}`}>
              {msg.user === "ai" ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
          ))}
          {isLoading && <div className="loading-message ai">...</div>}
        </div>
        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={input}
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