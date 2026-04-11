import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Dev-only: ?preview=<screen> renders mock screens without a backend
const isPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview');

async function mount() {
  let Root: React.ComponentType;
  if (isPreview) {
    const { default: Preview } = await import('./Preview');
    Root = Preview;
  } else {
    Root = App;
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>,
  );
}

mount();
