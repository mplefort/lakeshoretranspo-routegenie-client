"use strict";
/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./index.css");
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const App_1 = __importDefault(require("./components/App"));
console.log('👋 This message is being logged by "renderer.js", included via webpack');
// Get the root element from the HTML
const container = document.getElementById('root');
if (!container) {
    throw new Error('Root element not found');
}
// Create a root and render the App component
const root = (0, client_1.createRoot)(container);
root.render(react_1.default.createElement(App_1.default));
//# sourceMappingURL=renderer.js.map