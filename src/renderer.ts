/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 
 */

import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

console.log('👋 This message is being logged by "renderer.js", included via webpack');

// Get the root element from the HTML
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

// Create a root and render the App component
const root = createRoot(container);
root.render(React.createElement(App));
