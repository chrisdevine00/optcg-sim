import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/fraunces/wght.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/app.css';
import { App } from './App.tsx';
import { registerServiceWorker } from './update/updates.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// The service worker (images, app shell, update prompt; ARCHITECTURE §5) runs only in production builds.
if (import.meta.env.PROD) registerServiceWorker(import.meta.env.BASE_URL);
