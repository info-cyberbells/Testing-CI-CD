import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from './contexts/ConfigContext';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TranscriptionProvider } from './contexts/TranscriptionContext';
import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { HelmetProvider } from 'react-helmet-async';
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <HelmetProvider>
  <ConfigProvider>
    <UserProvider>
      <ThemeProvider>
        <TranscriptionProvider>
          <App />
        </TranscriptionProvider>
      </ThemeProvider>
    </UserProvider>
  </ConfigProvider>
  </HelmetProvider>
);

reportWebVitals();