// hooks/useOBDLiveMonitor.ts (Updated)
import { useCallback, useState, useRef } from 'react';
import base64 from 'react-native-base64';
import { Device, Subscription } from 'react-native-ble-plx';
import { parseOBDResponse } from '../utils/obdParser'; // Ensure this path is correct

const OBD_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export interface OBDData {
  [pidName: string]: {
    value: number;
    unit: string;
  };
}

export const useOBDLiveMonitor = () => {
  const [obdData, setObdData] = useState<OBDData>({});
  const [isMonitoring, setIsMonitoring] = useState(false);

  const monitorSubscriptionRef = useRef<Subscription | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const sendCommand = async (
    device: Device,
    writeUUID: string,
    cmd: string
  ) => {
    const encoded = base64.encode(cmd + '\r');
    try {
      await device.writeCharacteristicWithResponseForService(
        OBD_SERVICE_UUID,
        writeUUID,
        encoded
      );
    } catch (err) {
      await device.writeCharacteristicWithoutResponseForService(
        OBD_SERVICE_UUID,
        writeUUID,
        encoded
      );
    }
  };

  const startLiveOBDSession = useCallback(
    async (
      device: Device,
      writeUUID: string,
      readUUID: string,
      pids: string[]
    ) => {
      if (isMonitoring) return;

      console.log('🚗 Starting live OBD monitoring session...');
      setIsMonitoring(true);

      monitorSubscriptionRef.current = device.monitorCharacteristicForService(
        OBD_SERVICE_UUID,
        readUUID,
        (error, characteristic) => {
          if (error) {
            console.error('❌ Monitor error:', error);
            stopLiveOBDSession();
            return;
          }
          if (characteristic?.value) {
            const decoded = base64.decode(characteristic.value).trim();
            const parsed = parseOBDResponse(decoded); // This function now logs to console
            if (parsed) {
              setObdData((prevData) => ({
                ...prevData,
                [parsed.name]: { value: parsed.value, unit: parsed.unit },
              }));
            }
          }
        }
      );

      await sendCommand(device, writeUUID, 'ATE0'); // Echo off
      await delay(100);
      await sendCommand(device, writeUUID, 'ATSP0'); // Set protocol to auto
      await delay(100);

      pollingIntervalRef.current = setInterval(async () => {
        for (const pid of pids) {
          try {
            await sendCommand(device, writeUUID, pid);
            await delay(150);
          } catch (e) {
            console.error(`Error sending PID ${pid}:`, e);
            stopLiveOBDSession();
            break;
          }
        }
      }, 2000); // Poll all PIDs every 2 seconds
    },
    [isMonitoring]
  );

  const stopLiveOBDSession = useCallback(() => {
    console.log('🛑 Stopping live OBD monitoring session...');
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    if (monitorSubscriptionRef.current) {
      monitorSubscriptionRef.current.remove();
    }
    setIsMonitoring(false);
    setObdData({});
  }, []);

  return { obdData, isMonitoring, startLiveOBDSession, stopLiveOBDSession };
};
