import React, { useState } from 'react';
import BillingWorkflowModule from './modules/BillingWorkflowModule';

interface BillingWorkflowData {
  billingFrequency: 'All' | 'Daily' | 'Weekly' | 'Monthly';
  startDate: string;
  endDate: string;
  outputFolder: string;
  invoiceNumber: number;
}

const App: React.FC = () => {
  const [showBillingForm, setShowBillingForm] = useState<boolean>(false);

  const handleCreateBilling = () => {
    setShowBillingForm(true);
  };

  const handleBillingSubmit = (data: BillingWorkflowData) => {
    console.log('Billing workflow data:', data);
    // TODO: Implement billing workflow logic via IPC
    setShowBillingForm(false);
  };

  const handleBillingCancel = () => {
    setShowBillingForm(false);
  };

  return (
    <>
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '15px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
        margin: '0 auto',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <h1 style={{ 
          color: '#ffffff', 
          fontSize: '3rem',
          margin: '0 0 20px 0',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          Lakeshore Invoicer
        </h1>
        
        <p style={{
          color: '#f0f0f0',
          fontSize: '1.2rem',
          marginBottom: '40px'
        }}>
          Transportation invoicing application
        </p>

        <button
          onClick={handleCreateBilling}
          style={{
            padding: '15px 30px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#4CAF50',
            color: 'white',
            fontSize: '1.2rem',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Create Billing Invoice
        </button>

        <div style={{
          marginTop: '30px',
          padding: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          🚛 Ready to process transportation billing
        </div>
      </div>

      {showBillingForm && (
        <BillingWorkflowModule
          onSubmit={handleBillingSubmit}
          onCancel={handleBillingCancel}
        />
      )}
    </>
  );
};

export default App;
