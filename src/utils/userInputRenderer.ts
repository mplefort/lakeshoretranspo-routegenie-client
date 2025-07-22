// Re-export types
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

/**
 * Renderer process utility for handling user input dialogs
 */
export class UserInputRenderer {
  private static currentDialog: {
    requestId: string;
    resolve: (response: UserInputResponse) => void;
    reject: (error: Error) => void;
  } | null = null;

  /**
   * Initialize IPC listeners for user input dialogs
   */
  static initialize(): void {
    if (typeof window === 'undefined' || !window.electronAPI) {
      console.warn('UserInputRenderer can only be used in renderer process');
      return;
    }

    // Listen for dialog requests from main process
    window.electronAPI.userInput.onShowDialog((requestId: string, options: UserInputOptions) => {
      this.showDialog(requestId, options);
    });
  }

  /**
   * Show a dialog in the renderer process
   */
  private static showDialog(requestId: string, options: UserInputOptions): void {
    // If there's already a dialog open, close it first
    if (this.currentDialog) {
      this.currentDialog.reject(new Error('Dialog cancelled by new dialog'));
      this.currentDialog = null;
    }

    // Create a promise that will be resolved when the user responds
    const dialogPromise = new Promise<UserInputResponse>((resolve, reject) => {
      this.currentDialog = { requestId, resolve, reject };
    });

    // Dispatch custom event to trigger dialog display in React
    const event = new CustomEvent('show-user-input-dialog', {
      detail: { requestId, options, promise: dialogPromise }
    });
    window.dispatchEvent(event);

    // Handle the dialog response
    dialogPromise
      .then(response => {
        window.electronAPI.userInput.sendResponse(requestId, response);
        this.currentDialog = null;
      })
      .catch(error => {
        window.electronAPI.userInput.sendCancel(requestId, error.message);
        this.currentDialog = null;
      });
  }

  /**
   * Respond to the current dialog (called by UI components)
   */
  static respond(response: UserInputResponse): void {
    if (this.currentDialog) {
      this.currentDialog.resolve(response);
    }
  }

  /**
   * Cancel the current dialog (called by UI components)
   */
  static cancel(reason?: string): void {
    if (this.currentDialog) {
      this.currentDialog.reject(new Error(reason || 'User cancelled'));
    }
  }
}
