import { UserInputMain } from '../utils/userInputMain';

/**
 * Example service demonstrating various user input patterns
 */
export class ExampleUserInputService {
  
  /**
   * Example: Simple confirmation dialog
   */
  static async confirmOperation(): Promise<boolean> {
    try {
      const confirmed = await UserInputMain.confirm(
        'Are you sure you want to proceed with this operation?',
        'Confirm Operation'
      );
      return confirmed;
    } catch (error) {
      console.error('User input error:', error);
      return false;
    }
  }

  /**
   * Example: Simple alert dialog
   */
  static async showAlert(message: string): Promise<void> {
    try {
      await UserInputMain.alert(message, 'Information');
    } catch (error) {
      console.error('User input error:', error);
    }
  }

  /**
   * Example: Text input dialog
   */
  static async getCustomerName(): Promise<string | null> {
    try {
      const name = await UserInputMain.prompt(
        'Please enter the customer name:',
        'Customer Name',
        '',
        'Customer Information'
      );
      return name;
    } catch (error) {
      console.error('User input error:', error);
      return null;
    }
  }

  /**
   * Example: Custom dialog with multiple options
   */
  static async chooseProcessingMode(): Promise<'fast' | 'thorough' | 'cancel'> {
    try {
      const response = await UserInputMain.showDialog({
        title: 'Processing Mode',
        message: 'Choose how you would like to process the data:\n\n• Fast: Quick processing with basic validation\n• Thorough: Complete processing with full validation',
        buttons: [
          { id: 'fast', label: 'Fast Mode', variant: 'primary' },
          { id: 'thorough', label: 'Thorough Mode', variant: 'secondary' },
          { id: 'cancel', label: 'Cancel', variant: 'secondary' }
        ]
      });
      
      return response.buttonId as 'fast' | 'thorough' | 'cancel';
    } catch (error) {
      console.error('User input error:', error);
      return 'cancel';
    }
  }

  /**
   * Example: Dialog with text input and custom buttons
   */
  static async getInvoiceDetails(): Promise<{ action: string; invoiceNumber?: string }> {
    try {
      const response = await UserInputMain.showDialog({
        title: 'Invoice Processing',
        message: 'Enter the starting invoice number for this batch:',
        textInput: {
          placeholder: 'e.g., 1001',
          defaultValue: '1001',
          required: true
        },
        buttons: [
          { id: 'process', label: 'Process Invoices', variant: 'primary' },
          { id: 'save_draft', label: 'Save as Draft', variant: 'secondary' },
          { id: 'cancel', label: 'Cancel', variant: 'secondary' }
        ]
      });
      
      return {
        action: response.buttonId,
        invoiceNumber: response.textValue
      };
    } catch (error) {
      console.error('User input error:', error);
      return { action: 'cancel' };
    }
  }

  /**
   * Example: Error recovery dialog
   */
  static async handleError(errorMessage: string, canRetry: boolean = true): Promise<'retry' | 'continue' | 'abort'> {
    try {
      const buttons = [];
      
      if (canRetry) {
        buttons.push({ id: 'retry', label: 'Retry', variant: 'primary' as const });
        buttons.push({ id: 'continue', label: 'Continue Anyway', variant: 'secondary' as const });
      } else {
        buttons.push({ id: 'continue', label: 'Continue', variant: 'primary' as const });
      }
      
      buttons.push({ id: 'abort', label: 'Abort', variant: 'danger' as const });
      
      const response = await UserInputMain.showDialog({
        title: 'Error Occurred',
        message: `An error occurred during processing:\n\n${errorMessage}\n\nHow would you like to proceed?`,
        buttons
      });
      
      return response.buttonId as 'retry' | 'continue' | 'abort';
    } catch (error) {
      console.error('User input error:', error);
      return 'abort';
    }
  }

  /**
   * Example: File validation dialog
   */
  static async validateAndChooseFile(filePath: string, issues: string[]): Promise<{ action: 'use' | 'choose' | 'skip'; newPath?: string }> {
    try {
      let message = `File validation found issues with:\n${filePath}\n\nIssues found:\n`;
      issues.forEach((issue, index) => {
        message += `${index + 1}. ${issue}\n`;
      });
      message += '\nHow would you like to proceed?';

      const response = await UserInputMain.showDialog({
        title: 'File Validation Issues',
        message,
        buttons: [
          { id: 'use', label: 'Use Anyway', variant: 'primary' },
          { id: 'choose', label: 'Choose Different File', variant: 'secondary' },
          { id: 'skip', label: 'Skip This File', variant: 'secondary' }
        ]
      });

      if (response.buttonId === 'choose') {
        // In a real implementation, you might open a file dialog here
        const newPath = await UserInputMain.prompt(
          'Enter the path to the new file:',
          'File path',
          filePath,
          'Choose Alternative File'
        );
        return { action: 'choose', newPath: newPath || undefined };
      }

      return { action: response.buttonId as 'use' | 'skip' };
    } catch (error) {
      console.error('User input error:', error);
      return { action: 'skip' };
    }
  }
}
