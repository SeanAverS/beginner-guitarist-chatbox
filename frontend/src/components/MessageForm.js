import VoiceInput from "./VoiceInput";

// This component:
// Renders the chat input box, new chat button, and voice input button
function MessageForm({
  userInput,
  setInput,
  handleSendMessage,
  handleNewChat,
  handleVoiceTranscript,
  isLoading,
}) {
  return (
    // chat input box
    <form className="message-form" onSubmit={handleSendMessage}>
      <input
        type="text"
        value={userInput}
        onChange={(e) => setInput(e.target.value)}
        placeholder="How can I help?"
        disabled={isLoading}
      />

      {/* new chat button */}
      <button
        type="button"
        onClick={handleNewChat}
        className="new-chat-button"
        title="New Chat"
      >
        <i className="fa-solid fa-plus"></i>
      </button>

      {/* voice input button */}
      <VoiceInput onTranscript={handleVoiceTranscript} />
    </form>
  );
}

export default MessageForm;
