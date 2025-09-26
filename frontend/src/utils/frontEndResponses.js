// Handles API errors then displays a message to the user
export const handleApiError = (error, message, setMessages) => {
  console.error(message, error);
  const errorMessage = {
    text: "Sorry, I am unable to respond right now.",
    sender: "ai",
  };
  setMessages((prevMessages) => [...prevMessages, errorMessage]);
};

// Logs a success message to the console
export const handleSuccess = (message) => {
  console.log(message);
};

// a generic error handler for API requests
export const handleRequestError = (error, message) => {
  console.error(message, error);
  alert(`${message}.`);
};
