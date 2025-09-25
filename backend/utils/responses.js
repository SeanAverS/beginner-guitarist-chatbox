// Log errors to server console
export const devMessage = (message, error) => {
    console.error(message, error);
};

// Display errors to users
export const userMessage = (res, statusCode, message) => {
    return res.status(statusCode).json({ error: message });
};

// Display success response
export const successResponse = (res, data) => {
    return res.status(200).json(data);
};