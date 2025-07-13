"use strict";
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Define the API that will be exposed to the renderer process
const electronAPI = {
    hello: {
        getMessage: () => electron_1.ipcRenderer.invoke('hello:getMessage'),
        getCustomMessage: (name) => electron_1.ipcRenderer.invoke('hello:getCustomMessage', name),
    },
    getVersions: () => ({
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron,
    }),
    openFile: () => electron_1.ipcRenderer.invoke('dialog:openFile'),
    saveFile: (data) => electron_1.ipcRenderer.invoke('dialog:saveFile', data),
    buildInvoices: (inputPath, outputPath, startingNumber) => electron_1.ipcRenderer.invoke('invoice:build', inputPath, outputPath, startingNumber),
    billingWorkflow: {
        execute: (inputs) => electron_1.ipcRenderer.invoke('billingWorkflow:execute', inputs),
    },
    qb: {
        sync: (data) => electron_1.ipcRenderer.invoke('qb:sync', data),
    },
    buildQBSync: (data) => electron_1.ipcRenderer.invoke('qb:buildSync', data),
    showMessage: (message) => electron_1.ipcRenderer.invoke('dialog:showMessage', message),
    openFolder: (folderPath) => electron_1.ipcRenderer.invoke('shell:openFolder', folderPath),
    openLogFolder: () => electron_1.ipcRenderer.invoke('shell:openLogFolder'),
    openMileageCacheFolder: () => electron_1.ipcRenderer.invoke('shell:openMileageCacheFolder'),
    getSettings: () => electron_1.ipcRenderer.invoke('settings:get'),
    setSettings: (settings) => electron_1.ipcRenderer.invoke('settings:set', settings),
};
// Expose the API to the renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
//# sourceMappingURL=preload.js.map