import ReactMarkdown from "react-markdown";
import { useCurrentChat } from "../hooks/useCurrentChat";
import { useScrollToBottom } from "../hooks/useScrollToBottom"; 
import VoiceInput from "./VoiceInput";

// This component: 
// Renders the chatbox and its messages 
function ChatBox() {
  const { messages, userInput, isLoading, handleSendMessage, setInput } = useCurrentChat();
  const chatContainerRef = useScrollToBottom(messages);
  const handleVoiceTranscript = (transcript) => {
    setInput(transcript); 
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Beginner Guitarist Advice</h1>
      </header>
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
        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How can I help?"
            disabled={isLoading}
          />
          <VoiceInput onTranscript={handleVoiceTranscript} />
        </form>
      </main>
    </div>
  );
}

export default ChatBox;