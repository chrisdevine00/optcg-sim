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

// Open the saved-games store first (IndexedDB, or the in-memory fallback; never rejects), so the
// tutorial timing log and lethal progress can be read synchronously from the first render.
void initStore().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

// The service worker (images, app shell, update prompt; ARCHITECTURE §5) runs only in production builds.
if (import.meta.env.PROD) registerServiceWorker(import.meta.env.BASE_URL);
