import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '../index.css';
import '../i18n';
import ManzurVisualPreview from './ManzurVisualPreview';

const root = document.getElementById('root');
if (!root) throw new Error('Preview root is missing');
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter><ManzurVisualPreview /></BrowserRouter>
  </React.StrictMode>,
);
