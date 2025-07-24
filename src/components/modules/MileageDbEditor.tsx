import React, { useState, useEffect, useMemo } from 'react';
import { MileageCacheEntry } from '../../services/mileageCache';

interface MileageDbEditorProps {
  onClose: () => void;
  onResult: (result: { success: boolean; message: string }) => void;
}

interface EditableMileageEntry extends MileageCacheEntry {
  isEdited?: boolean;
}

interface ColumnFilters {
  [key: string]: string;
}

const MileageDbEditor: React.FC<MileageDbEditorProps> = ({ onClose, onResult }) => {
  const [data, setData] = useState<EditableMileageEntry[]>([]);
  const [originalData, setOriginalData] = useState<EditableMileageEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [filters, setFilters] = useState<ColumnFilters>({});

  // Column definitions
  const columns = [
    { key: 'id', label: 'ID', editable: false, width: '80px' },
    { key: 'passenger_last_name', label: 'Last Name', editable: false, width: '150px' },
    { key: 'passenger_first_name', label: 'First Name', editable: false, width: '150px' },
    { key: 'PU_address', label: 'Pickup Address', editable: false, width: '200px' },
    { key: 'DO_address', label: 'Dropoff Address', editable: false, width: '200px' },
    { key: 'RG_miles', label: 'RG Miles', editable: false, width: '100px' },
    { key: 'Google_miles', label: 'Google Miles', editable: false, width: '100px' },
    { key: 'overwrite_miles', label: 'Overwrite Miles', editable: true, width: '120px' },
    { key: 'RG_dead_miles', label: 'RG Dead Miles', editable: false, width: '120px' },
    { key: 'Google_dead_miles', label: 'Google Dead Miles', editable: false, width: '120px' },
    { key: 'overwrite_dead_miles', label: 'Overwrite Dead Miles', editable: true, width: '150px' },
    { key: 'created_at', label: 'Created', editable: false, width: '150px' },
    { key: 'updated_at', label: 'Updated', editable: false, width: '150px' }
  ];

  // Load data on mount
  useEffect(() => {
    loadMileageData();
  }, []);

  const loadMileageData = async () => {
    try {
      setLoading(true);
      
      // Call the backend to get all mileage cache entries
      const result = await window.electronAPI.mileageCache.getAllEntries();
      
      if (result.success) {
        // Sort by ID ascending (lowest to highest)
        const sortedData = (result.data || []).sort((a, b) => (a.id || 0) - (b.id || 0));
        setData(sortedData);
        setOriginalData(JSON.parse(JSON.stringify(sortedData))); // Deep copy
      } else {
        onResult({ success: false, message: `Failed to load mileage data: ${result.message}` });
        onClose();
      }
    } catch (error) {
      console.error('Error loading mileage data:', error);
      onResult({ success: false, message: `Error loading mileage data: ${error}` });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on column filters
  const filteredData = useMemo(() => {
    if (Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter(row => {
      return Object.entries(filters).every(([column, filterValue]) => {
        if (!filterValue) return true;
        
        const cellValue = row[column as keyof EditableMileageEntry];
        if (cellValue === null || cellValue === undefined) return false;
        
        return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  }, [data, filters]);

  // Handle filter changes
  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Handle cell edits
  const handleCellEdit = (rowIndex: number, column: string, value: string) => {
    const actualRowIndex = data.findIndex(row => row.id === filteredData[rowIndex].id);
    
    setData(prev => {
      const newData = [...prev];
      const numValue = parseFloat(value);
      
      // Only allow numeric values for editable fields
      if (isNaN(numValue) && value !== '') {
        return prev; // Don't update if not a valid number
      }
      
      newData[actualRowIndex] = {
        ...newData[actualRowIndex],
        [column]: value === '' ? null : numValue,
        isEdited: true
      };
      
      return newData;
    });
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    return data.some(row => row.isEdited);
  };

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get only the edited entries
      const editedEntries = data.filter(row => row.isEdited);
      
      if (editedEntries.length === 0) {
        onResult({ success: true, message: 'No changes to save.' });
        onClose();
        return;
      }

      // Call backend to save changes
      const result = await window.electronAPI.mileageCache.updateEntries(editedEntries);
      
      if (result.success) {
        onResult({ 
          success: true, 
          message: `Successfully updated ${editedEntries.length} entries and synced to cloud.` 
        });
        onClose();
      } else {
        onResult({ success: false, message: `Failed to save changes: ${result.message}` });
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      onResult({ success: false, message: `Error saving changes: ${error}` });
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      const confirmDiscard = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (!confirmDiscard) {
        return;
      }
    }
    onClose();
  };

  // Format cell value for display
  const formatCellValue = (value: any, column: string) => {
    if (value === null || value === undefined) return '';
    
    // Format dates
    if (column.includes('_at') && typeof value === 'string') {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }
    
    // Format numbers
    if (typeof value === 'number') {
      return value.toString();
    }
    
    return String(value);
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(3, 72, 110, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '15px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '3px solid #2563eb'
        }}>
          <div style={{ 
            fontSize: '1.2rem', 
            marginBottom: '20px',
            color: '#1e3a8a',
            fontWeight: 'bold'
          }}>
            Loading Mileage Database...
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Syncing from cloud storage
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(3, 72, 110, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      padding: '20px',
      boxSizing: 'border-box' // Include padding in width calculation
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '15px 15px 0 0',
        borderBottom: '2px solid #2563eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h2 style={{ 
            margin: 0, 
            color: '#1e3a8a',
            fontSize: '1.8rem',
            fontWeight: 'bold'
          }}>
            Mileage Database Editor
          </h2>
          <p style={{ 
            margin: '5px 0 0 0', 
            color: '#666', 
            fontSize: '0.9rem' 
          }}>
            Showing {filteredData.length} of {data.length} records
            {hasUnsavedChanges() && (
              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}> • Unsaved Changes</span>
            )}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: hasUnsavedChanges() ? '#2563eb' : '#d1d5db',
              color: 'white',
              cursor: hasUnsavedChanges() ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'all 0.2s ease'
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          
          <button
            onClick={handleCancel}
            disabled={saving}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '2px solid #2563eb',
              backgroundColor: 'white',
              color: '#2563eb',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              opacity: saving ? 0.6 : 1
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div style={{
        backgroundColor: 'white',
        flex: 1,
        overflow: 'hidden', // Prevent overflow on container
        borderRadius: '0 0 15px 15px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          overflow: 'auto', // Enable both horizontal and vertical scrolling
          flex: 1
        }}>
          <table style={{
            width: 'max-content', // Allow table to be wider than container
            minWidth: '100%', // Ensure table fills container when content is narrow
            borderCollapse: 'collapse',
            fontSize: '0.85rem'
          }}>
          {/* Header with filters */}
          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white' }}>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              {columns.map(column => (
                <th
                  key={column.key}
                  style={{
                    padding: '8px',
                    border: '1px solid #e5e7eb',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    width: column.width,
                    minWidth: column.width,
                    backgroundColor: column.editable ? '#dcfce7' : '#f8f9fa',
                    color: '#1e3a8a'
                  }}
                >
                  <div style={{ marginBottom: '5px' }}>
                    {column.label}
                  </div>
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filters[column.key] || ''}
                    onChange={(e) => handleFilterChange(column.key, e.target.value)}
                    style={{
                      width: '75%',
                      padding: '4px',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      fontSize: '0.8rem',
                      backgroundColor: 'white',
                      color: '#374151'
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {filteredData.map((row, rowIndex) => (
              <tr
                key={row.id}
                style={{
                  backgroundColor: row.isEdited ? '#fef3c7' : (rowIndex % 2 === 0 ? 'white' : '#f8f9fa')
                }}
              >
                {columns.map(column => (
                  <td
                    key={column.key}
                    style={{
                      padding: '8px',
                      border: '1px solid #e5e7eb',
                      width: column.width,
                      minWidth: column.width,
                      maxWidth: column.width,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#374151'
                    }}
                  >
                    {column.editable ? (
                      <input
                        type="number"
                        step="0.1"
                        value={formatCellValue(row[column.key as keyof EditableMileageEntry], column.key)}
                        onChange={(e) => handleCellEdit(rowIndex, column.key, e.target.value)}
                        style={{
                          width: '75%',
                          padding: '4px',
                          border: '1px solid #d1d5db',
                          borderRadius: '3px',
                          fontSize: '0.8rem',
                          backgroundColor: 'white',
                          color: '#374151'
                        }}
                        placeholder="Enter number"
                      />
                    ) : (
                      <span title={formatCellValue(row[column.key as keyof EditableMileageEntry], column.key)}>
                        {formatCellValue(row[column.key as keyof EditableMileageEntry], column.key)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {filteredData.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '1.1rem'
          }}>
            {data.length === 0 ? 'No mileage data found.' : 'No records match the current filters.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MileageDbEditor;
