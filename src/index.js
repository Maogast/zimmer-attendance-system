// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Get the root element from the DOM
const container = document.getElementById('root');

// Create a root and render your app
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker
serviceWorkerRegistration.register();