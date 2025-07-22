import React, { useState, useEffect } from 'react';
import { UserInputOptions, UserInputResponse } from '../../utils/userInputRenderer';

interface UserInputDialogProps {
  isOpen: boolean;
  options: UserInputOptions | null;
  onResponse: (response: UserInputResponse) => void;
  onCancel: () => void;
}

const UserInputDialog: React.FC<UserInputDialogProps> = ({ isOpen, options, onResponse, onCancel }) => {
  const [textValue, setTextValue] = useState('');

  useEffect(() => {
    if (options?.textInput?.defaultValue) {
      setTextValue(options.textInput.defaultValue);
    } else {
      setTextValue('');
    }
  }, [options]);

  if (!isOpen || !options) {
    return null;
  }

  const handleButtonClick = (buttonId: string) => {
    const response: UserInputResponse = {
      buttonId,
      textValue: options.textInput ? textValue : undefined
    };
    
    // Validate required text input
    if (options.textInput?.required && !textValue.trim()) {
      return; // Don't allow submission with empty required input
    }
    
    onResponse(response);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && options.buttons.length === 1) {
      handleButtonClick(options.buttons[0].id);
    } else if (event.key === 'Escape') {
      onCancel();
    }
  };

  const getButtonStyle = (variant?: string, isDisabled?: boolean) => {
    const baseStyle = {
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '1rem',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      fontWeight: 'bold',
      transition: 'all 0.2s ease',
      opacity: isDisabled ? 0.6 : 1,
      border: 'none'
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: 'var(--primary-blue)',
          color: 'var(--primary-white)',
          border: 'none'
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: '#dc2626',
          color: 'var(--primary-white)',
          border: 'none'
        };
      case 'secondary':
      default:
        return {
          ...baseStyle,
          backgroundColor: 'var(--primary-white)',
          color: 'var(--primary-blue)',
          border: `2px solid var(--primary-blue)`
        };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(3, 72, 110, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000
    }}>
      <div 
        style={{
          backgroundColor: 'var(--primary-white)',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: 'var(--shadow-primary)',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: `3px solid var(--primary-blue)`,
          margin: '0 20px'
        }}
        onKeyDown={handleKeyPress}
      >
        {/* Title */}
        {options.title && (
          <h3 style={{
            margin: '0 0 20px 0',
            color: 'var(--dark-navy)',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            {options.title}
          </h3>
        )}
        
        {/* Message */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{
            color: 'var(--dark-navy)',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.5',
            fontSize: '1rem'
          }}>
            {options.message}
          </p>
        </div>
        
        {/* Text Input */}
        {options.textInput && (
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={options.textInput.placeholder}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: `2px solid var(--primary-blue)`,
                fontSize: '1rem',
                backgroundColor: 'var(--primary-white)',
                color: 'var(--dark-navy)',
                outline: 'none'
              }}
              autoFocus
              required={options.textInput.required}
            />
            {options.textInput.required && !textValue.trim() && (
              <p style={{
                color: '#dc2626',
                fontSize: '0.875rem',
                marginTop: '4px'
              }}>
                This field is required
              </p>
            )}
          </div>
        )}
        
        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'flex-end'
        }}>
          {options.buttons.map((button) => {
            const isDisabled = options.textInput?.required && !textValue.trim();
            return (
              <button
                key={button.id}
                onClick={() => handleButtonClick(button.id)}
                disabled={isDisabled}
                style={getButtonStyle(button.variant, isDisabled)}
                onMouseOver={(e) => {
                  if (!isDisabled) {
                    const target = e.currentTarget;
                    if (button.variant === 'primary') {
                      target.style.backgroundColor = 'var(--accent-teal)';
                    } else if (button.variant === 'danger') {
                      target.style.backgroundColor = '#b91c1c';
                    } else {
                      target.style.backgroundColor = 'var(--light-blue)';
                    }
                  }
                }}
                onMouseOut={(e) => {
                  if (!isDisabled) {
                    const target = e.currentTarget;
                    if (button.variant === 'primary') {
                      target.style.backgroundColor = 'var(--primary-blue)';
                    } else if (button.variant === 'danger') {
                      target.style.backgroundColor = '#dc2626';
                    } else {
                      target.style.backgroundColor = 'var(--primary-white)';
                    }
                  }
                }}
              >
                {button.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UserInputDialog;
