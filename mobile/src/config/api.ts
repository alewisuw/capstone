import axios from 'axios';

// Change this to your FastAPI server URL
// For local development: 'http://localhost:8000'
// For Android emulator: 'http://10.0.2.2:8000'
// For iOS simulator: 'http://localhost:8000'
// For physical device: Replace with your computer's IP address, e.g., 'http://192.168.1.100:8000'
const API_BASE_URL = __DEV__ 
  ? 'http://127.0.0.1:8000' 
  : 'https://your-api-url.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

