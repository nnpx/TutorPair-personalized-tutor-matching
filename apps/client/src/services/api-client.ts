import axios from 'axios';
import { fetchAuthSession } from '@aws-amplify/auth';
import { useAuthStore } from '../store/auth.store';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Cognito ID token to every request (with mock token fallback)
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

  // Fallback to local development mock token
  if (!config.headers.Authorization) {
    const user = useAuthStore.getState().user;
    if (user?.id) {
      config.headers.Authorization = `Bearer mock-token-${user.id}`;
    } else {
      // Default to mock-admin-id in local dev if no user is set yet
      config.headers.Authorization = 'Bearer mock-token-mock-admin-id';
    }
  }

  return config;
});

export default apiClient;
