// Log errors to server console
export const devMessage = (message, error) => {
    console.error(message, error);
};

// Display errors to users
export const userMessage = (res, statusCode, message) => {
    res.status(statusCode).json({ error: message });
};