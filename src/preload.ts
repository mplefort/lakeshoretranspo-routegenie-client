// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI, BillingWorkflowFormInputs, UserInputOptions, UserInputResponse } from './types/electron';

// Define the API that will be exposed to the renderer process
const electronAPI: IElectronAPI = {
  getVersions: () => ({
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  }),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data: any) => ipcRenderer.invoke('dialog:saveFile', data),
  buildInvoices: (inputPath: string, outputPath: string, startingNumber: number) => 
    ipcRenderer.invoke('invoice:build', inputPath, outputPath, startingNumber),
  billingWorkflow: {
    execute: (inputs: BillingWorkflowFormInputs) => ipcRenderer.invoke('billingWorkflow:execute', inputs),
  },
  mileageCache: {
    getAllEntries: () => ipcRenderer.invoke('mileageCache:getAllEntries'),
    updateEntries: (entries: any[]) => ipcRenderer.invoke('mileageCache:updateEntries', entries),
  },
  qb: {
    sync: (data: any) => ipcRenderer.invoke('qb:sync', data),
  },
  buildQBSync: (data: any) => ipcRenderer.invoke('qb:buildSync', data),
  showMessage: (message: string) => ipcRenderer.invoke('dialog:showMessage', message),
  openFolder: (folderPath: string) => ipcRenderer.invoke('shell:openFolder', folderPath),
  openLogFolder: () => ipcRenderer.invoke('shell:openLogFolder'),
  openMileageCacheFolder: () => ipcRenderer.invoke('shell:openMileageCacheFolder'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: any) => ipcRenderer.invoke('settings:set', settings),
  userInput: {
    onShowDialog: (callback: (requestId: string, options: UserInputOptions) => void) => {
      ipcRenderer.on('show-user-input-dialog', (event, requestId: string, options: UserInputOptions) => {
        callback(requestId, options);
      });
    },
    sendResponse: (requestId: string, response: UserInputResponse) => 
      ipcRenderer.invoke('user-input-response', requestId, response),
    sendCancel: (requestId: string, error: string) => 
      ipcRenderer.invoke('user-input-cancel', requestId, error),
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);