import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // StrictMode can double-invoke effects in dev, which is fine, 
  // but for the game loop we need to be careful with refs.
  // The logic handles cleanup correctly.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
