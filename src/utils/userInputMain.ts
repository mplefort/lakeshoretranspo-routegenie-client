import { ipcMain, BrowserWindow } from 'electron';

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
 * Main process utility for showing user input dialogs
 */
export class UserInputMain {
  private static pendingPromises = new Map<string, {
    resolve: (response: UserInputResponse) => void;
    reject: (error: Error) => void;
  }>();

  /**
   * Initialize IPC handlers for user input dialogs
   */
  static initialize(): void {
    // Handle responses from renderer
    ipcMain.handle('user-input-response', (event, requestId: string, response: UserInputResponse) => {
      const pending = this.pendingPromises.get(requestId);
      if (pending) {
        this.pendingPromises.delete(requestId);
        pending.resolve(response);
      }
    });

    // Handle cancellation/errors from renderer
    ipcMain.handle('user-input-cancel', (event, requestId: string, error?: string) => {
      const pending = this.pendingPromises.get(requestId);
      if (pending) {
        this.pendingPromises.delete(requestId);
        pending.reject(new Error(error || 'User input cancelled'));
      }
    });
  }

  /**
   * Show a user input dialog and wait for response
   */
  static async showDialog(options: UserInputOptions, window?: BrowserWindow): Promise<UserInputResponse> {
    const requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    return new Promise<UserInputResponse>((resolve, reject) => {
      // Store the promise resolvers
      this.pendingPromises.set(requestId, { resolve, reject });

      // Get the focused window or use the provided one
      const targetWindow = window || BrowserWindow.getFocusedWindow();
      if (!targetWindow) {
        this.pendingPromises.delete(requestId);
        reject(new Error('No active window found'));
        return;
      }

      // Send the dialog request to renderer
      targetWindow.webContents.send('show-user-input-dialog', requestId, options);

      // Set a timeout to prevent hanging forever
      setTimeout(() => {
        if (this.pendingPromises.has(requestId)) {
          this.pendingPromises.delete(requestId);
          reject(new Error('User input dialog timeout'));
        }
      }, 300000); // 5 minute timeout
    });
  }

  /**
   * Convenience method for simple confirmation dialogs
   */
  static async confirm(message: string, title?: string): Promise<boolean> {
    const response = await this.showDialog({
      message,
      title: title || 'Confirm',
      buttons: [
        { id: 'yes', label: 'Yes', variant: 'primary' },
        { id: 'no', label: 'No', variant: 'secondary' }
      ]
    });
    return response.buttonId === 'yes';
  }

  /**
   * Convenience method for simple alert dialogs
   */
  static async alert(message: string, title?: string): Promise<void> {
    await this.showDialog({
      message,
      title: title || 'Alert',
      buttons: [
        { id: 'ok', label: 'OK', variant: 'primary' }
      ]
    });
  }

  /**
   * Convenience method for text input dialogs
   */
  static async prompt(message: string, placeholder?: string, defaultValue?: string, title?: string): Promise<string | null> {
    const response = await this.showDialog({
      message,
      title: title || 'Input Required',
      textInput: {
        placeholder,
        defaultValue,
        required: true
      },
      buttons: [
        { id: 'ok', label: 'OK', variant: 'primary' },
        { id: 'cancel', label: 'Cancel', variant: 'secondary' }
      ]
    });
    
    return response.buttonId === 'ok' ? (response.textValue || '') : null;
  }
}
