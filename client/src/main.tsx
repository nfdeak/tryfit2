import React from 'react';
import ReactDOM from 'react-dom/client';
// Configure axios defaults (baseURL, withCredentials) before any component mounts.
import './lib/api';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
