import React from 'react';
import ReactDOM from 'react-dom/client';
import NotificationApp from './NotificationApp';
import './index.css';

const storedTheme = localStorage.getItem('clipdb-theme')
  ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.classList.toggle('dark', storedTheme === 'dark');

document.documentElement.style.background = 'transparent';
document.documentElement.style.overflow = 'hidden';
document.body.style.background = 'transparent';
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

ReactDOM.createRoot(document.getElementById('root-notification')).render(
  <React.StrictMode>
    <NotificationApp />
  </React.StrictMode>
);
