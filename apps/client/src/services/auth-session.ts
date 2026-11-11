import { signOut } from 'aws-amplify/auth';
import { useAuthStore } from '../store/auth.store';

export async function endAuthSession(): Promise<void> {
  try {
    if (import.meta.env.PROD) await signOut();
  } catch {
    // Local application state must still be cleared if Cognito sign-out fails.
  } finally {
    useAuthStore.getState().clearAuth();
  }
}
