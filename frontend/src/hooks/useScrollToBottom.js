import { useRef, useEffect } from "react";

// This hook: 
// scrolls the page to the bottom whenever there's a new message
export function useScrollToBottom(messages) {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return chatContainerRef;
}