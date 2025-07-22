# User Input Dialog System

This system provides a clean interface for showing pop-up dialogs with messages, optional text inputs, and multiple response buttons in the Lakeshore Invoicer application.

## Overview

The user input system consists of:
- **Main Process** (`UserInputMain`): Handles showing dialogs and managing responses
- **Renderer Process** (`UserInputRenderer`): Handles display and user interaction 
- **React Components**: UI components for displaying dialogs
- **IPC Communication**: Bridges main and renderer processes

## File Structure

```
src/
├── utils/
│   └── userInput.ts          # Core utilities for main and renderer processes
├── components/
│   └── common/
│       ├── UserInputDialog.tsx    # React dialog component
│       └── useUserInputDialog.ts  # React hook for dialog management
├── scripts/
│   └── exampleUserInputs.ts  # Example scripts demonstrating usage patterns
└── types/
    └── electron.d.ts         # TypeScript definitions for IPC
```

## Setup

### 1. Main Process Setup

The system is automatically initialized in `src/index.ts`:

```typescript
import { UserInputMain } from './utils/userInput';

// In setupIpcHandlers function:
UserInputMain.initialize();
```

### 2. Renderer Process Setup

The dialog is integrated into the main App component (`src/components/App.tsx`):

```tsx
import UserInputDialog from './common/UserInputDialog';
import { useUserInputDialog } from './common/useUserInputDialog';

const App: React.FC = () => {
  const userInputDialog = useUserInputDialog();
  
  return (
    <>
      {/* Your app content */}
      
      <UserInputDialog
        isOpen={userInputDialog.isOpen}
        options={userInputDialog.options}
        onResponse={userInputDialog.onResponse}
        onCancel={userInputDialog.onCancel}
      />
    </>
  );
};
```

## Usage in Services

For more comprehensive examples and usage patterns, see `src/scripts/exampleUserInputs.ts` which contains practical examples for various scenarios.

### Basic Confirmation Dialog

```typescript
import { UserInputMain } from '../utils/userInput';

const confirmed = await UserInputMain.confirm(
  'Are you sure you want to delete this file?',
  'Confirm Deletion'
);

if (confirmed) {
  // Proceed with deletion
}
```

### Simple Alert Dialog

```typescript
await UserInputMain.alert(
  'Operation completed successfully!',
  'Success'
);
```

### Text Input Dialog

```typescript
const customerName = await UserInputMain.prompt(
  'Please enter the customer name:',
  'Customer Name',      // placeholder
  'Default Name',       // default value
  'Customer Information' // title
);

if (customerName) {
  // Use the entered name
}
```

### Custom Dialog with Multiple Buttons

```typescript
const response = await UserInputMain.showDialog({
  title: 'Processing Options',
  message: 'Choose how to process the data:',
  textInput: {
    placeholder: 'Enter batch size',
    defaultValue: '100',
    required: true
  },
  buttons: [
    { id: 'fast', label: 'Fast Mode', variant: 'primary' },
    { id: 'thorough', label: 'Thorough Mode', variant: 'secondary' },
    { id: 'cancel', label: 'Cancel', variant: 'secondary' }
  ]
});

console.log('User chose:', response.buttonId);
console.log('Text input:', response.textValue);
```

## Dialog Options

### UserInputOptions Interface

```typescript
interface UserInputOptions {
  message: string;           // Main message to display
  title?: string;           // Optional dialog title
  textInput?: {             // Optional text input field
    placeholder?: string;   // Input placeholder text
    defaultValue?: string;  // Default input value
    required?: boolean;     // Whether input is required
  };
  buttons: UserInputButton[]; // Array of buttons
}
```

### UserInputButton Interface

```typescript
interface UserInputButton {
  id: string;                           // Unique button identifier
  label: string;                        // Button text
  variant?: 'primary' | 'secondary' | 'danger'; // Button style
}
```

### UserInputResponse Interface

```typescript
interface UserInputResponse {
  buttonId: string;    // ID of the clicked button
  textValue?: string;  // Text input value (if text input was present)
}
```

## Button Variants

- **primary**: Blue button, typically for the main action
- **secondary**: Gray button, for secondary actions
- **danger**: Red button, for destructive actions

## Error Handling

All dialog methods are async and should be wrapped in try-catch blocks:

```typescript
try {
  const result = await UserInputMain.showDialog(options);
  // Handle result
} catch (error) {
  console.error('Dialog error:', error);
  // Handle error (user cancelled, timeout, etc.)
}
```

## Practical Examples

### File Processing with User Confirmation

```typescript
// In createInvoice.ts
if (!fs.existsSync(requiredFile)) {
  const shouldContinue = await UserInputMain.confirm(
    `Required file not found: ${requiredFile}\n\nContinue without this file?`,
    'Missing File'
  );
  
  if (!shouldContinue) {
    throw new Error('Operation cancelled by user');
  }
}
```

### Dynamic Error Recovery

```typescript
try {
  await processData();
} catch (error) {
  const action = await UserInputMain.showDialog({
    title: 'Processing Error',
    message: `Error: ${error.message}\n\nHow would you like to proceed?`,
    buttons: [
      { id: 'retry', label: 'Retry', variant: 'primary' },
      { id: 'skip', label: 'Skip and Continue', variant: 'secondary' },
      { id: 'abort', label: 'Abort', variant: 'danger' }
    ]
  });
  
  switch (action.buttonId) {
    case 'retry':
      return await processData(); // Recursive retry
    case 'skip':
      console.log('Skipping failed operation');
      break;
    case 'abort':
      throw new Error('Operation aborted by user');
  }
}
```

### Configuration Input

```typescript
const config = await UserInputMain.showDialog({
  title: 'Export Configuration',
  message: 'Configure export settings:',
  textInput: {
    placeholder: 'Output filename',
    defaultValue: 'export.csv',
    required: true
  },
  buttons: [
    { id: 'export_all', label: 'Export All', variant: 'primary' },
    { id: 'export_filtered', label: 'Export Filtered', variant: 'secondary' },
    { id: 'cancel', label: 'Cancel', variant: 'secondary' }
  ]
});

const filename = config.textValue;
const exportType = config.buttonId;
```

## Notes

- Dialogs automatically timeout after 5 minutes to prevent hanging
- Only one dialog can be shown at a time (new dialogs replace existing ones)
- The system handles both main process and renderer process communication automatically
- All dialogs are modal and will block the script execution until the user responds
- Text inputs support Enter key for submission (when only one button is present)
- Escape key cancels the dialog
