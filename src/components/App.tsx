import React, { useState, useEffect } from 'react';

interface HelloResponse {
  message: string;
  timestamp: string;
  source: string;
}

const App: React.FC = () => {
  const [helloData, setHelloData] = useState<HelloResponse | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Load the initial hello message on component mount
  useEffect(() => {
    loadHelloMessage();
  }, []);

  const loadHelloMessage = async () => {
    try {
      setLoading(true);
      const response = await window.electronAPI.hello.getMessage();
      setHelloData(response);
    } catch (error) {
      console.error('Failed to load hello message:', error);
      // Fallback message if IPC fails
      setHelloData({
        message: 'Hello World (Fallback)',
        timestamp: new Date().toISOString(),
        source: 'Renderer Process'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomMessage = async () => {
    if (!customName.trim()) return;
    
    try {
      setLoading(true);
      const response = await window.electronAPI.hello.getCustomMessage(customName);
      setHelloData(response);
    } catch (error) {
      console.error('Failed to load custom message:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff'
      }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '15px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h1 style={{ 
        color: '#ffffff', 
        fontSize: '3rem',
        margin: '0 0 20px 0',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
      }}>
        {helloData?.message || 'Hello World'}
      </h1>
      
      <div style={{
        marginBottom: '30px',
        padding: '15px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#f0f0f0'
      }}>
        <div><strong>Source:</strong> {helloData?.source}</div>
        <div><strong>Timestamp:</strong> {helloData?.timestamp && new Date(helloData.timestamp).toLocaleString()}</div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter your name"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          style={{
            padding: '10px',
            borderRadius: '5px',
            border: 'none',
            marginRight: '10px',
            fontSize: '1rem',
            minWidth: '200px'
          }}
        />
        <button
          onClick={loadCustomMessage}
          disabled={!customName.trim()}
          style={{
            padding: '10px 20px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: '#4CAF50',
            color: 'white',
            fontSize: '1rem',
            cursor: customName.trim() ? 'pointer' : 'not-allowed',
            opacity: customName.trim() ? 1 : 0.6
          }}
        >
          Get Custom Message
        </button>
      </div>

      <button
        onClick={loadHelloMessage}
        style={{
          padding: '10px 20px',
          borderRadius: '5px',
          border: 'none',
          backgroundColor: '#2196F3',
          color: 'white',
          fontSize: '1rem',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        Refresh Message
      </button>

      <div style={{
        marginTop: '30px',
        padding: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        fontSize: '0.9rem'
      }}>
        🎉 IPC Communication Working!
      </div>
    </div>
  );
};

export default App;
