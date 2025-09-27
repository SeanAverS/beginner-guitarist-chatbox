import Messages from "./Messages";
import MessageForm from "./MessageForm";
import Sidebar from "./SideBar";
import { useCurrentChat } from "../hooks/useCurrentChat";
import { useScrollToBottom } from "../hooks/useScrollToBottom";
import { useChatSidebar } from "../hooks/useChatSidebar";
import Header from "./Header";

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
    handleLoadChat,
    handleSidebarToggle,
    handleRenameChat,
    handleDeleteChat,
    sidebarRef,
  } = useChatSidebar(setMessages, setChatFilename, chatFilename, handleNewChat);

  const chatContainerRef = useScrollToBottom(messages);
  const handleVoiceTranscript = (transcript) => {
    setInput(transcript); 
  };

  return (
    <div className="App">
       <Header handleSidebarToggle={handleSidebarToggle} />

      <Sidebar
      savedChats={savedChats}
      chatFilename={chatFilename}
      isSidebarOpen={isSidebarOpen}
      sidebarRef={sidebarRef}
      handleLoadChat={handleLoadChat}
      handleRenameChat={handleRenameChat}
      handleDeleteChat={handleDeleteChat}
      />

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