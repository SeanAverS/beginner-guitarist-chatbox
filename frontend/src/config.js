// Define the live production URL from Render
const RENDER_API_URL = "https://beginner-guitarist-chatbox.onrender.com";

// Set the API URL based on the environment (NODE_ENV is 'production' during build)
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? RENDER_API_URL 
  : "http://localhost:3001";
