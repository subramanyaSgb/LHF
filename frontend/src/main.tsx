import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { useThemeStore } from '@/stores/themeStore';

// Apply persisted theme before first render
const theme = useThemeStore.getState().theme;
document.documentElement.setAttribute('data-theme', theme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
