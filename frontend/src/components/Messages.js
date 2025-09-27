import ReactMarkdown from "react-markdown";

// This component:
// displays user and ai messages
function Messages({ messages, isLoading }) {
  return (
    <div className="messages">
      {messages.map((msg, index) => {

        let messageContent;
        
        if (msg.sender === "ai") {
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
  );
}

export default Messages;
