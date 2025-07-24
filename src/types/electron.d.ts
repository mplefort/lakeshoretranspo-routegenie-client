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

export interface UserInputButton {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface UserInputOptions {
  message: string;
  title?: string;
  textInput?: {
    placeholder?: string;
    defaultValue?: string;
    required?: boolean;
  };
  buttons: UserInputButton[];
}

export interface UserInputResponse {
  buttonId: string;
  textValue?: string;
}

export interface IElectronAPI {

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
  
  // Mileage Cache operations
  mileageCache: {
    getAllEntries: () => Promise<{ success: boolean; data?: any[]; message?: string }>;
    updateEntries: (entries: any[]) => Promise<{ success: boolean; message: string }>;
  };
  
  // QB Sync operations
  qb: {
    sync: (data: any) => Promise<any>;
  };
  buildQBSync: (data: any) => Promise<void>;
  
  // Utility operations
  showMessage: (message: string) => Promise<void>;
  openFolder: (folderPath: string) => Promise<void>;
  openLogFolder: () => Promise<void>;
  openMileageCacheFolder: () => Promise<void>;
  
  // Settings
  getSettings: () => Promise<any>;
  setSettings: (settings: any) => Promise<void>;
  
  // User Input
  userInput: {
    onShowDialog: (callback: (requestId: string, options: UserInputOptions) => void) => void;
    sendResponse: (requestId: string, response: UserInputResponse) => void;
    sendCancel: (requestId: string, error: string) => void;
  };
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
