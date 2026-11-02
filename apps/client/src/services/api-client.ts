import axios from 'axios';
import { fetchAuthSession } from '@aws-amplify/auth';
import { useAuthStore } from '../store/auth.store';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Cognito ID token or retained authentication token
apiClient.interceptors.request.use(async (config) => {
  // If an Authorization header was already explicitly provided on this request, preserve it
  if (config.headers.Authorization) {
    return config;
  }

  // 1. In production / cloud, attempt to fetch live AWS Cognito ID token
  try {
    const session = await fetchAuthSession();
    const cognitoToken = session.tokens?.idToken?.toString();
    if (cognitoToken) {
      config.headers.Authorization = `Bearer ${cognitoToken}`;
      return config;
    }
  } catch {
    // Session not found / Cognito not configured in local environment
  }

  // 2. Read retained authentication credentials from the store
  const { user, token } = useAuthStore.getState();

  // If an authentic token is stored from login (e.g. mock-token-mock-tutor-id), attach it
  if (token) {
    const bearer = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    config.headers.Authorization = bearer;
    if (user?.email) {
      config.headers['X-Mock-Email'] = user.email;
    }
    return config;
  }

  // 3. Fallback: If cognito_sub exists on user, use mock-token-${cognito_sub}
  if (user?.cognito_sub) {
    config.headers.Authorization = `Bearer mock-token-${user.cognito_sub}`;
    if (user.email) {
      config.headers['X-Mock-Email'] = user.email;
    }
    return config;
  }

  // 4. Fallback: If user.id was previously stored as a mock ID (e.g. mock-student-id)
  if (user?.id?.startsWith('mock-')) {
    config.headers.Authorization = `Bearer mock-token-${user.id}`;
    if (user.email) {
      config.headers['X-Mock-Email'] = user.email;
    }
    return config;
  }

  return config;
});

export default apiClient;
