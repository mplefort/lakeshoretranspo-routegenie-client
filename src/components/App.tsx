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
      
      // Always close the form after getting a result (success or failure)
      setShowBillingForm(false);
    } catch (error) {
      console.error('Failed to execute billing workflow:', error);
      setLastResult({
        success: false,
        message: `Failed to execute billing workflow: ${error}`
      });
      // Close form even on catch error
      setShowBillingForm(false);
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
    // Enhance error messages for better user experience
    let enhancedMessage = message;
    if (message.includes('EBUSY') && message.includes('resource busy or locked')) {
      enhancedMessage = message + '\n\n💡 This usually means the file is open in Excel or another program. Please close the file and try again.';
    } else if (message.includes('ENOENT')) {
      enhancedMessage = message + '\n\n💡 This means a required file was not found. Please check that all mapping files exist.';
    } else if (message.includes('authenticate') || message.includes('credentials')) {
      enhancedMessage = message + '\n\n💡 Please check your RouteGenie credentials in the .env file.';
    }

    // Find all path matches first
    const pathMatches: { match: string; start: number; end: number }[] = [];
    
    // Regex patterns for different types of paths
    const patterns = [
      /[A-Za-z]:[\\\/][\w\s\\\/.-]+/g,  // Windows absolute paths (C:\Users\...)
      /\.\/[\w\\\/.-]+(?:\/[\w\\\/.-]+)*/g,  // Relative paths starting with ./
      /\.\\[\w\\\/.-]+(?:\\[\w\\\/.-]+)*/g   // Relative paths starting with .\
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(enhancedMessage)) !== null) {
        const matchText = match[0];
        // Exclude matches that are clearly not file paths
        if (!matchText.includes(' Please ') && 
            !matchText.includes(' This ') && 
            !matchText.includes(' close ') &&
            !matchText.includes(' try ') &&
            !matchText.endsWith(' again') &&
            matchText.length > 3) {
          pathMatches.push({
            match: matchText,
            start: match.index,
            end: match.index + matchText.length
          });
        }
      }
    });

    // Sort matches by position (descending) to process from end to beginning
    pathMatches.sort((a, b) => b.start - a.start);

    // Build result by processing the message and wrapping paths
    const result: (string | React.ReactElement)[] = [];
    let lastIndex = enhancedMessage.length;

    pathMatches.forEach((pathMatch, index) => {
      // Add text after this match
      if (lastIndex > pathMatch.end) {
        result.unshift(enhancedMessage.substring(pathMatch.end, lastIndex));
      }
      
      // Add the clickable path
      result.unshift(
        <span
          key={`path-${index}`}
          onClick={() => handleOpenFolder(pathMatch.match)}
          style={{
            textDecoration: 'underline',
            cursor: 'pointer',
            color: 'inherit',
            fontWeight: 'bold'
          }}
          title="Click to open in File Explorer"
        >
          {pathMatch.match}
        </span>
      );
      
      lastIndex = pathMatch.start;
    });

    // Add any remaining text at the beginning
    if (lastIndex > 0) {
      result.unshift(enhancedMessage.substring(0, lastIndex));
    }

    return result.length > 0 ? result : [enhancedMessage];
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

  const handleOpenMileageCacheFolder = async () => {
    try {
      await window.electronAPI.openMileageCacheFolder();
    } catch (error) {
      console.error('Failed to open mileage cache folder:', error);
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
          <div style={{ marginTop: '8px', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span
              onClick={handleOpenLogFolder}
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
                color: 'var(--primary-blue)',
                fontSize: '0.8rem'
              }}
              title="Click to open log folder"
            >
              📁 View Application Logs
            </span>
            <span
              onClick={handleOpenMileageCacheFolder}
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
                color: 'var(--primary-blue)',
                fontSize: '0.8rem'
              }}
              title="Click to open mileage cache database folder"
            >
              �️ View Mileage Cache DB
            </span>
          </div>
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
            whiteSpace: 'pre-line' // Allow line breaks to render properly
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
