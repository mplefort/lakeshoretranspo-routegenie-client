import React, { useState } from 'react';
import { BillingWorkflowFormInputs } from '../../types/electron';

interface BillingWorkflowModuleProps {
  onSubmit: (data: BillingWorkflowFormInputs) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const BillingWorkflowModule: React.FC<BillingWorkflowModuleProps> = ({ onSubmit, onCancel, isProcessing = false }) => {
  // Get today's date in YYYY-MM-DD format for HTML date inputs
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<BillingWorkflowFormInputs>({
    billingFrequency: 'All',
    startDate: today,
    endDate: today,
    outputFolder: './reports/billing',
    invoiceNumber: 1000,
  });

  const handleInputChange = (field: keyof BillingWorkflowFormInputs, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Convert HTML date format (YYYY-MM-DD) to MM/DD/YYYY format expected by workflow
  const convertDateFormat = (htmlDate: string): string => {
    if (!htmlDate) return '';
    const [year, month, day] = htmlDate.split('-');
    return `${month}/${day}/${year}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert dates to expected format before submitting
    const submissionData: BillingWorkflowFormInputs = {
      ...formData,
      startDate: convertDateFormat(formData.startDate),
      endDate: convertDateFormat(formData.endDate)
    };
    
    onSubmit(submissionData);
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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--primary-white)',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: 'var(--shadow-primary)',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        border: `3px solid var(--primary-blue)`
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          color: 'var(--dark-navy)',
          textAlign: 'center',
          fontSize: '1.8rem',
          fontWeight: 'bold'
        }}>
          Create Billing Invoice
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Billing Frequency */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: 'var(--dark-navy)'
            }}>
              Billing Frequency:
            </label>
            <select
              value={formData.billingFrequency}
              onChange={(e) => handleInputChange('billingFrequency', e.target.value as 'All' | 'Daily' | 'Weekly' | 'Monthly')}
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
            >
              <option value="All">All</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          {/* Start Date */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: 'var(--dark-navy)'
            }}>
              Start Date:
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
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
              required
            />
          </div>

          {/* End Date */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: 'var(--dark-navy)'
            }}>
              End Date:
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
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
              required
            />
          </div>

          {/* Output Folder */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: 'var(--dark-navy)'
            }}>
              Output Folder:
            </label>
            <input
              type="text"
              value={formData.outputFolder}
              onChange={(e) => handleInputChange('outputFolder', e.target.value)}
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
              placeholder="./reports/billing"
              required
            />
          </div>

          {/* Invoice Number */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: 'var(--dark-navy)'
            }}>
              Invoice Number:
            </label>
            <input
              type="number"
              value={formData.invoiceNumber}
              onChange={(e) => handleInputChange('invoiceNumber', parseInt(e.target.value) || 1000)}
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
              min="1"
              required
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: `2px solid var(--primary-blue)`,
                backgroundColor: 'var(--primary-white)',
                color: 'var(--primary-blue)',
                fontSize: '1rem',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                opacity: isProcessing ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.backgroundColor = 'var(--light-blue)';
                }
              }}
              onMouseOut={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-white)';
                }
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isProcessing ? 'var(--medium-blue)' : 'var(--primary-blue)',
                color: 'var(--primary-white)',
                fontSize: '1rem',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                opacity: isProcessing ? 0.8 : 1
              }}
              onMouseOver={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-teal)';
                }
              }}
              onMouseOut={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-blue)';
                }
              }}
            >
              {isProcessing ? 'Processing...' : 'Start'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillingWorkflowModule;
