import React, { useState } from 'react';

interface BillingWorkflowData {
  billingFrequency: 'All' | 'Daily' | 'Weekly' | 'Monthly';
  startDate: string;
  endDate: string;
  outputFolder: string;
  invoiceNumber: number;
}

interface BillingWorkflowModuleProps {
  onSubmit: (data: BillingWorkflowData) => void;
  onCancel: () => void;
}

const BillingWorkflowModule: React.FC<BillingWorkflowModuleProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<BillingWorkflowData>({
    billingFrequency: 'All',
    startDate: '',
    endDate: '',
    outputFolder: './reports/billing',
    invoiceNumber: 1000,
  });

  const handleInputChange = (field: keyof BillingWorkflowData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          color: '#333',
          textAlign: 'center',
          fontSize: '1.5rem'
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
              color: '#333'
            }}>
              Billing Frequency:
            </label>
            <select
              value={formData.billingFrequency}
              onChange={(e) => handleInputChange('billingFrequency', e.target.value as 'All' | 'Daily' | 'Weekly' | 'Monthly')}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '1rem'
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
              color: '#333'
            }}>
              Start Date:
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '1rem'
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
              color: '#333'
            }}>
              End Date:
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '1rem'
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
              color: '#333'
            }}>
              Output Folder:
            </label>
            <input
              type="text"
              value={formData.outputFolder}
              onChange={(e) => handleInputChange('outputFolder', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '1rem'
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
              color: '#333'
            }}>
              Invoice Number:
            </label>
            <input
              type="number"
              value={formData.invoiceNumber}
              onChange={(e) => handleInputChange('invoiceNumber', parseInt(e.target.value) || 1000)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                fontSize: '1rem'
              }}
              min="1"
              required
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                backgroundColor: '#f5f5f5',
                color: '#333',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: '#4CAF50',
                color: 'white',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Start
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillingWorkflowModule;
