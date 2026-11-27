import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/fraunces/wght.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/app.css';
import { App } from './App.tsx';
import { initStore } from './store/open.ts';
import { registerServiceWorker } from './update/updates.ts';

// Render at once. The saved-games store (IndexedDB, or the in-memory fallback; never rejects) opens in
// parallel and marks itself ready; the routes that read saved data wait for it under StoreGate, the
// rest never do (M10 WP1).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
void initStore();

// The service worker (images, app shell, update prompt; ARCHITECTURE §5) runs only in production builds.
if (import.meta.env.PROD) registerServiceWorker(import.meta.env.BASE_URL);
