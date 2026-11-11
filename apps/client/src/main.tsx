import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Amplify } from 'aws-amplify';
import App from './App';
import './index.css';

const { VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID, VITE_AWS_REGION, VITE_COGNITO_DOMAIN } = import.meta.env;
if (import.meta.env.PROD && (!VITE_COGNITO_USER_POOL_ID || !VITE_COGNITO_CLIENT_ID || !VITE_AWS_REGION || !VITE_COGNITO_DOMAIN)) {
  throw new Error('Production builds require VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID, VITE_AWS_REGION, and VITE_COGNITO_DOMAIN.');
}
if (VITE_COGNITO_USER_POOL_ID && VITE_AWS_REGION && !VITE_COGNITO_USER_POOL_ID.startsWith(`${VITE_AWS_REGION}_`)) {
  throw new Error('VITE_AWS_REGION must match the region in VITE_COGNITO_USER_POOL_ID.');
}
if (VITE_COGNITO_USER_POOL_ID && VITE_COGNITO_CLIENT_ID && VITE_AWS_REGION && VITE_COGNITO_DOMAIN) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: VITE_COGNITO_CLIENT_ID,
        loginWith: {
          oauth: {
            domain: VITE_COGNITO_DOMAIN,
            scopes: ['openid', 'email', 'profile'],
            redirectSignIn: [`${window.location.origin}/login`],
            redirectSignOut: [`${window.location.origin}/login`],
            responseType: 'code',
          },
        },
      },
    },
  });
}

import { queryClient } from './services/query-client';
import { ScrollToTop } from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollToTop />
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
