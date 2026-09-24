import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './routes';
import './index.css';
import useAuthStore from './store/authStore';
import { Toaster } from 'react-hot-toast';

function App() {
  const initialize = useAuthStore(state => state.initialize);
  
  useEffect(() => {
    initialize();
  }, []); // Run strictly once on mount

  return (
    <React.StrictMode>
      <AppRouter />
      <Toaster position="top-right" />
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
