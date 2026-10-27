import axios from 'axios';
import { fetchAuthSession } from '@aws-amplify/auth';
import { useAuthStore } from '../store/auth.store';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Cognito ID token or local development mock token
apiClient.interceptors.request.use(async (config) => {
  const user = useAuthStore.getState().user;

  // 1. In local dev mode, immediately attach mock token if mock user is active
  if (user?.id?.startsWith('mock-')) {
    config.headers.Authorization = `Bearer mock-token-${user.id}`;
    if (user.email) {
      config.headers['X-Mock-Email'] = user.email;
    }
    return config;
  }

  // 2. Production AWS Cognito ID token
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Session not found / Cognito not configured
  }

  // 3. Fallback for any other user
  if (!config.headers.Authorization && user?.id) {
    config.headers.Authorization = `Bearer mock-token-${user.id}`;
    if (user?.email) {
      config.headers['X-Mock-Email'] = user.email;
    }
  }

  return config;
});

export default apiClient;
