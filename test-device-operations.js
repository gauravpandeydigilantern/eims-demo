// Test script to verify device operations endpoint
const testDeviceOperations = async () => {
  const baseUrl = 'http://localhost:5000';
  
  try {
    // First, let's check if we can get devices
    console.log('Testing device operations...');
    
    // Test the operations endpoint with the MAC address
    const response = await fetch(`${baseUrl}/api/devices/24:30:29:75:c7:86/operations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        operation: 'DIAGNOSTICS',
        parameters: {}
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testDeviceOperations();