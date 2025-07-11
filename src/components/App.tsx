import React, { useState } from 'react';
import BillingWorkflowModule from './modules/BillingWorkflowModule';
import { BillingWorkflowFormInputs } from '../types/electron';

const App: React.FC = () => {
  const [showBillingForm, setShowBillingForm] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCreateBilling = () => {
    setShowBillingForm(true);
    setLastResult(null); // Clear previous results
  };

  const handleBillingSubmit = async (data: BillingWorkflowFormInputs) => {
    console.log('Billing workflow data:', data);
    setIsProcessing(true);
    
    try {
      const result = await window.electronAPI.billingWorkflow.execute(data);
      setLastResult(result);
      console.log('Billing workflow result:', result);
      
      if (result.success) {
        // Close form on success
        setShowBillingForm(false);
      }
    } catch (error) {
      console.error('Failed to execute billing workflow:', error);
      setLastResult({
        success: false,
        message: `Failed to execute billing workflow: ${error}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBillingCancel = () => {
    setShowBillingForm(false);
    setLastResult(null);
  };

  // Function to detect and make folder paths clickable
  const renderMessageWithClickablePaths = (message: string) => {
    // Regex to match Windows-style paths (e.g., ./reports/billing, C:\Users\..., etc.)
    const pathRegex = /([A-Za-z]:[\\\/][\w\s\\\/.-]+|\.[\w\s\\\/.-]*[\w\\\/])/g;
    const parts = message.split(pathRegex);
    
    return parts.map((part, index) => {
      if (pathRegex.test(part)) {
        return (
          <span
            key={index}
            onClick={() => handleOpenFolder(part)}
            style={{
              textDecoration: 'underline',
              cursor: 'pointer',
              color: 'inherit',
              fontWeight: 'bold'
            }}
            title="Click to open in File Explorer"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleOpenFolder = async (folderPath: string) => {
    try {
      await window.electronAPI.openFolder(folderPath);
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const handleOpenLogFolder = async () => {
    try {
      await window.electronAPI.openLogFolder();
    } catch (error) {
      console.error('Failed to open log folder:', error);
    }
  };

  return (
    <>
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        background: 'var(--dark-navy)',
        borderRadius: '15px',
        boxShadow: 'var(--shadow-primary)',
        maxWidth: '600px',
        margin: '0 auto',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        border: `2px solid var(--primary-blue)`
      }}>
        <h1 style={{ 
          color: 'var(--primary-white)', 
          fontSize: '3rem',
          margin: '0 0 20px 0',
          textShadow: `2px 2px 4px var(--dark-navy)`
        }}>
          Lakeshore Invoicer
        </h1>
        
        <p style={{
          color: 'var(--primary-white)',
          fontSize: '1.2rem',
          marginBottom: '40px',
          opacity: '0.9'
        }}>
          Transportation invoicing application
        </p>

        <button
          onClick={handleCreateBilling}
          style={{
            padding: '15px 30px',
            borderRadius: '8px',
            border: `2px solid var(--primary-blue)`,
            backgroundColor: 'var(--primary-blue)',
            color: 'var(--primary-white)',
            fontSize: '1.2rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-light)',
            transition: 'all 0.2s ease',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.backgroundColor = 'var(--accent-teal)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.backgroundColor = 'var(--primary-blue)';
          }}
        >
          Create Billing Invoice
        </button>

        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: 'var(--primary-white)',
          borderRadius: '8px',
          fontSize: '0.9rem',
          border: `1px solid var(--primary-blue)`,
          color: 'var(--dark-navy)',
        }}>
          🚛 Ready to process transportation billing
          <br />
          <span
            onClick={handleOpenLogFolder}
            style={{
              textDecoration: 'underline',
              cursor: 'pointer',
              color: 'var(--primary-blue)',
              fontSize: '0.8rem',
              marginTop: '5px',
              display: 'inline-block'
            }}
            title="Click to open log folder"
          >
            📁 View Application Logs
          </span>
        </div>

        {/* Display last result */}
        {lastResult && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: lastResult.success ? '#d4edda' : '#f8d7da',
            borderRadius: '8px',
            fontSize: '0.9rem',
            border: `1px solid ${lastResult.success ? '#c3e6cb' : '#f5c6cb'}`,
            color: lastResult.success ? '#155724' : '#721c24',
          }}>
            <strong>{lastResult.success ? '✅ Success:' : '❌ Error:'}</strong>
            <br />
            {renderMessageWithClickablePaths(lastResult.message)}
          </div>
        )}
      </div>

      {showBillingForm && (
        <BillingWorkflowModule
          onSubmit={handleBillingSubmit}
          onCancel={handleBillingCancel}
          isProcessing={isProcessing}
        />
      )}
    </>
  );
};

export default App;
