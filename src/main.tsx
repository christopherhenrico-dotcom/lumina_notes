import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign environment-related errors
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    const msg = args[0]?.toString() || '';
    if (
      msg.includes('Cannot set property fetch') || 
      msg.includes('MetaMask') ||
      msg.includes('failed to connect to websocket')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('Cannot set property fetch') || 
      event.message?.includes('MetaMask')
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.message?.includes('Cannot set property fetch') || 
      event.reason?.message?.includes('MetaMask')
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
