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
