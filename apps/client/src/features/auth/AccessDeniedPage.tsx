import { Link } from 'react-router-dom';
import { Card } from '../../components/ui';
import { useAuthStore } from '../../store/auth.store';
/** Keep role protection explicit instead of falling back to the public homepage. */
export function AccessDeniedPage() {
  const user = useAuthStore(state => state.user);
  return <Card style={{ padding: '2.5rem' }}>
    <h1 style={{ marginBottom: 16 }}>This page needs a different account</h1>
    <p style={{ marginBottom: 12 }}>You’re currently signed in as {user?.role.toLowerCase() || 'a different user'}.</p>
    <p style={{ marginBottom: 24 }}>The Tutor Portal is available to tutor accounts. To open a link from a tutor notification email, sign in with your tutor account in this browser.</p>
    <Link to="/login" className="flat-btn flat-btn-primary">Choose an account</Link>
  </Card>;
}
