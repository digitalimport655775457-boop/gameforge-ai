import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA service worker safely for standalone installability with immediate updates
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    const registerSW = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          reg.update().catch(() => {});
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .catch((err) => {
          console.debug('Service worker registration fallback:', err);
        });
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      registerSW();
    } else {
      window.addEventListener('DOMContentLoaded', registerSW);
      window.addEventListener('load', registerSW);
    }
  } catch {
    // Graceful fallback for sandboxed environments
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
