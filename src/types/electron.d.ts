export interface HelloResponse {
  message: string;
  timestamp: string;
  source: string;
}

export interface BillingWorkflowFormInputs {
  startDate: string;
  endDate: string;
  billingFrequency: 'All' | 'Daily' | 'Weekly' | 'Monthly';
  invoiceNumber: number;
  outputFolder: string;
}

export interface BillingWorkflowResult {
  success: boolean;
  message: string;
  outputDir: string;
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
  
  // Billing workflow operations
  billingWorkflow: {
    execute: (inputs: BillingWorkflowFormInputs) => Promise<BillingWorkflowResult>;
  };
  
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
