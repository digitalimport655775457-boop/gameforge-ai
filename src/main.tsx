import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure any stale service workers or caches are purged for live preview and standalone use
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().catch(() => {});
      }
    }).catch(() => {});
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
