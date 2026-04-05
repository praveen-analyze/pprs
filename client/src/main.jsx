import React          from 'react';
import ReactDOM       from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster }    from 'react-hot-toast';
import App            from './App';
import ErrorBoundary  from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff', color: '#111827',
              border: '1px solid #E5E7EB', borderRadius: '10px',
              fontSize: '14px', fontWeight: '500',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            },
            success: { iconTheme: { primary: '#16A34A', secondary: '#ffffff' } },
            error  : { iconTheme: { primary: '#DC2626', secondary: '#ffffff' } },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
