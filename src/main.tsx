import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure service workers do NOT intercept or corrupt the live preview iframe or dev mode
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    const isIframe = window.self !== window.top;
    const isDev = import.meta.env.DEV;

    if (isIframe || isDev) {
      // In iframe preview and dev mode, unregister any active workers to ensure fresh, live rendering
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {});
        }
      }).catch(() => {});
    } else {
      // Only register in top-level standalone production windows
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((reg) => {
            reg.update().catch(() => {});
          })
          .catch(() => {});
      });
    }
  } catch {
    // Graceful fallback
  }
}

// Guard against unhandled Firebase Auth network rejections in sandboxed iframe previews
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (
      reason &&
      (reason.code === 'auth/network-request-failed' ||
        String(reason.message || reason).includes('auth/network-request-failed'))
    ) {
      event.preventDefault();
      console.warn('Prevented unhandled Firebase Auth network exception in iframe:', reason?.message || reason);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
