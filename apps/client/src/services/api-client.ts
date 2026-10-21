import axios from 'axios';
import { fetchAuthSession } from '@aws-amplify/auth';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Cognito ID token (or mock token in local development)
apiClient.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    }
  } catch {
    // Session not found / Cognito not configured
  }

  // Fallback to Zustand mock auth user in local development mode
  let storedUser = (window as any).__TP_CURRENT_USER__;
  if (!storedUser) {
    try {
      const raw = localStorage.getItem('tp_mock_user');
      if (raw) storedUser = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  if (storedUser?.id) {
    config.headers.Authorization = `Bearer mock-token-${storedUser.id}`;
  } else {
    // If accessing admin routes in local development without session, default to mock-admin-id
    config.headers.Authorization = 'Bearer mock-token-mock-admin-id';
  }

  return config;
});

export default apiClient;
