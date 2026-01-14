import axios from 'axios';
import { Platform } from 'react-native';

// Change this to your FastAPI server URL
// For local development: 'http://localhost:8000'
// For Android emulator: 'http://10.0.2.2:8000'
// For iOS simulator: 'http://localhost:8000'
// For physical device: Replace with your computer's IP address, e.g., 'http://192.168.1.100:8000'
const DEV_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? DEV_BASE_URL : 'https://your-api-url.com');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
