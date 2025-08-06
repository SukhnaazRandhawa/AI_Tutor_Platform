import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData: {
    name: string;
    email: string;
    password: string;
    language: string;
    aiTutorName: string;
  }) => api.post('/api/auth/register', userData),

  login: (credentials: { email: string; password: string }) =>
    api.post('/api/auth/login', credentials),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (profileData: {
    name?: string;
    language?: string;
    aiTutorName?: string;
  }) => api.put('/api/user/profile', profileData),
};

// Session API
export const sessionAPI = {
  startSession: (subject: string) =>
    api.post('/api/session/start', { subject }),

  sendMessage: (message: string, sessionId: string) =>
    api.post('/api/session/message', { message, sessionId }),

  getActiveSession: () => api.get('/api/session/active'),

  endSession: (sessionId: string) =>
    api.post('/api/session/end', { sessionId }),

  getSessionHistory: () => api.get('/api/session/history'),
};

// Voice API
export const voiceAPI = {
  speechToText: (audioFile: File, language: string = 'en') => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('language', language);
    return api.post('/api/voice/speech-to-text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  textToSpeech: (text: string, voiceId?: string) =>
    api.post('/api/voice/text-to-speech', { text, voiceId }),

  getVoices: () => api.get('/api/voice/voices'),

  getVoiceStatus: () => api.get('/api/voice/status'),

  processAudio: (audioFile: File) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    return api.post('/api/voice/process-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Avatar API
export const avatarAPI = {
  generateAvatar: (data: {
    text: string;
    platform: 'd-id' | 'heygen';
    avatarConfig: {
      gender: 'male' | 'female';
      age: number;
      ethnicity: string;
      style: 'professional' | 'friendly' | 'casual';
      clothing: string;
    };
    voiceId?: string;
    background?: string;
    resolution?: '720p' | '1080p';
  }) => api.post('/api/avatar/generate', data),

  getVideoStatus: (videoId: string, platform: 'd-id' | 'heygen') =>
    api.get(`/api/avatar/status/${videoId}?platform=${platform}`),

  downloadVideo: (videoId: string, platform: 'd-id' | 'heygen', downloadUrl: string) =>
    api.get(`/api/avatar/download/${videoId}?platform=${platform}&downloadUrl=${encodeURIComponent(downloadUrl)}`),

  streamVideo: (videoId: string, platform: 'd-id' | 'heygen') =>
    api.get(`/api/avatar/stream/${videoId}?platform=${platform}`),

  getAvailableAvatars: () => api.get('/api/avatar/available'),

  createAvatarConfig: (config: {
    gender: 'male' | 'female';
    age: number;
    ethnicity: string;
    style: 'professional' | 'friendly' | 'casual';
    clothing?: string;
  }) => api.post('/api/avatar/create-config', config),

  getAvatarStatus: () => api.get('/api/avatar/status'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/'),
};

export default api; 