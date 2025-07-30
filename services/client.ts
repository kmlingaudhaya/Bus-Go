// src/api/client.ts
import { OBDData } from '../hooks/useOBDLiveMonitor'; // We will define this type in the hook

const API_ENDPOINT = 'https://safeway-backend-75xq.onrender.com/api/obd/data';

export const sendDataToBackend = async (trip_id: string, obdData: OBDData) => {
  // Don't send empty data
  if (Object.keys(obdData).length === 0) {
    console.log('Skipping backend update: no data yet.');
    return;
  }

  const payload = {
    trip_id: trip_id,
    device_id: 'obd2logger-1', // Using the requested static device_id
    timestamp: new Date().toISOString(),
    data: obdData,
  };

  try {
    console.log('🚀 Sending data to backend...', payload);
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorBody}`);
    }

    const responseData = await response.json();
    console.log('✅ Backend update successful:', responseData.message);
  } catch (error) {
    console.error('❌ Failed to send data to backend:', error);
  }
};
