// Central API configuration
// In production (Vercel), VITE_API_BASE_URL will be set to the Render backend URL.
// In development, it falls back to localhost:5000.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default API_BASE_URL;
