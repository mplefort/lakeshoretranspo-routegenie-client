export interface HelloResponse {
  message: string;
  timestamp: string;
  source: string;
}

export interface IElectronAPI {
  // Hello service
  hello: {
    getMessage: () => Promise<HelloResponse>;
    getCustomMessage: (name: string) => Promise<HelloResponse>;
  };
  
  // App version info
  getVersions: () => {
    node: string;
    chrome: string;
    electron: string;
  };
  
  // File operations
  openFile: () => Promise<string | undefined>;
  saveFile: (data: any) => Promise<string | undefined>;
  
  // Invoice operations
  buildInvoices: (inputPath: string, outputPath: string, startingNumber: number) => Promise<void>;
  
  // QB Sync operations
  qb: {
    sync: (data: any) => Promise<any>;
  };
  buildQBSync: (data: any) => Promise<void>;
  
  // Utility operations
  showMessage: (message: string) => Promise<void>;
  
  // Settings
  getSettings: () => Promise<any>;
  setSettings: (settings: any) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
