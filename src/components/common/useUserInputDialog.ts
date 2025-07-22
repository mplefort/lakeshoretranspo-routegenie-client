import { useState, useEffect } from 'react';
import { UserInputOptions, UserInputResponse, UserInputRenderer } from '../../utils/userInputRenderer';

interface DialogState {
  isOpen: boolean;
  options: UserInputOptions | null;
  requestId: string | null;
}

export const useUserInputDialog = () => {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    options: null,
    requestId: null
  });

  useEffect(() => {
    // Initialize the UserInputRenderer when the hook is first used
    UserInputRenderer.initialize();

    // Listen for dialog events from the main process
    const handleShowDialog = (event: CustomEvent) => {
      const { requestId, options } = event.detail;
      setDialogState({
        isOpen: true,
        options,
        requestId
      });
    };

    window.addEventListener('show-user-input-dialog', handleShowDialog as EventListener);

    return () => {
      window.removeEventListener('show-user-input-dialog', handleShowDialog as EventListener);
    };
  }, []);

  const handleResponse = (response: UserInputResponse) => {
    UserInputRenderer.respond(response);
    setDialogState({
      isOpen: false,
      options: null,
      requestId: null
    });
  };

  const handleCancel = () => {
    UserInputRenderer.cancel('User cancelled dialog');
    setDialogState({
      isOpen: false,
      options: null,
      requestId: null
    });
  };

  return {
    isOpen: dialogState.isOpen,
    options: dialogState.options,
    onResponse: handleResponse,
    onCancel: handleCancel
  };
};
