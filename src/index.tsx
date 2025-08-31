import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Import service worker for PWA functionality (optional)
// import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for offline functionality
// Uncomment when you're ready to add PWA features
// serviceWorkerRegistration.register();

// Performance measuring (optional)
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// import reportWebVitals from './reportWebVitals';
// reportWebVitals();
