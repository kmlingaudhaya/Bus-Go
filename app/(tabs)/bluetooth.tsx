// BluetoothPage.tsx (Complete and Corrected)
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BleManager, Device, ScanMode, State } from 'react-native-ble-plx';
import { useOBDLiveMonitor, OBDData } from '../../hooks/useOBDLiveMonitor';
import { sendDataToBackend } from '../../services/client'; // Ensure this path is correct

const manager = new BleManager();
const OBD_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const WRITE_UUID_FRAGMENT = 'fff2';
const READ_UUID_FRAGMENT = 'fff1';

// Define the PIDs you want to monitor here
const PIDS_TO_MONITOR = ['010C', '010D', '0111', '012F'];

export default function BluetoothPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [writeUUID, setWriteUUID] = useState<string | null>(null);
  const [readUUID, setReadUUID] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);

  const { obdData, isMonitoring, startLiveOBDSession, stopLiveOBDSession } =
    useOBDLiveMonitor();

  // --- THE FIX: Create a ref to hold the latest OBD data ---
  const latestObdDataRef = useRef<OBDData>(obdData);

  const backendUpdateIntervalRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  // Effect for Bluetooth permissions and manager setup
  useEffect(() => {
    const sub = manager.onStateChange((state) => {
      if (state === State.PoweredOn) {
        console.log('✅ Bluetooth ON');
        sub.remove();
      }
    }, true);

    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]).then((result) => console.log('📱 Android permissions:', result));
    }

    return () => {
      manager.destroy();
      if (backendUpdateIntervalRef.current) {
        clearInterval(backendUpdateIntervalRef.current);
      }
    };
  }, []);

  // --- THE FIX: Add a new effect to keep the ref updated ---
  // This effect runs whenever obdData changes, ensuring the ref always has the latest value.
  useEffect(() => {
    latestObdDataRef.current = obdData;
  }, [obdData]);

  // --- THE FIX: Modify the backend update effect ---
  useEffect(() => {
    if (isMonitoring && tripId) {
      backendUpdateIntervalRef.current = setInterval(() => {
        // Use the data from the ref here. The ref is always up-to-date.
        sendDataToBackend(tripId, latestObdDataRef.current);
      }, 5000); // 5 seconds
    } else {
      if (backendUpdateIntervalRef.current) {
        clearInterval(backendUpdateIntervalRef.current);
      }
    }
    return () => {
      if (backendUpdateIntervalRef.current) {
        clearInterval(backendUpdateIntervalRef.current);
      }
    };
  }, [isMonitoring, tripId]); // IMPORTANT: `obdData` is removed from dependencies

  // --- Functions for scanning and connecting ---

  const scanDevices = () => {
    console.log('🔍 Starting scan...');
    setScanning(true);
    setDevices([]);
    const seen: Record<string, boolean> = {};

    manager.startDeviceScan(
      null,
      { scanMode: ScanMode.LowLatency },
      (error, device) => {
        if (error) {
          console.error('❌ Scan error:', error);
          setScanning(false);
          return;
        }
        if (device && device.name && !seen[device.id]) {
          seen[device.id] = true;
          setDevices((prev) => [...prev, device]);
          console.log('📡 Found:', device.name, device.id);
        }
      }
    );

    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
      console.log('🛑 Scan stopped.');
    }, 7000);
  };

  const connectToDevice = async (device: Device) => {
    setConnecting(true);
    try {
      console.log('🔗 Connecting to', device.name, device.id);
      const connected = await manager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();

      const services = await connected.services();
      const service = services.find(
        (s) => s.uuid.toLowerCase() === OBD_SERVICE_UUID
      );

      if (!service) {
        console.warn('❌ OBD2 service not found');
        return;
      }

      const characteristics = await service.characteristics();
      const writeChar = characteristics.find((c) =>
        c.uuid.toLowerCase().includes(WRITE_UUID_FRAGMENT)
      );
      const readChar = characteristics.find((c) =>
        c.uuid.toLowerCase().includes(READ_UUID_FRAGMENT)
      );

      if (!writeChar || !readChar) {
        console.error('⚠️ Required UUIDs (write/read) not found');
        return;
      }

      console.log('✍ Write UUID:', writeChar.uuid);
      console.log('📖 Read UUID:', readChar.uuid);

      setConnectedDevice(connected);
      setWriteUUID(writeChar.uuid);
      setReadUUID(readChar.uuid);

      console.log(
        '✅ Connection successful. Ready for user to start monitoring.'
      );
    } catch (e) {
      console.error('❌ Connection error:', e);
    } finally {
      setConnecting(false);
    }
  };

  // --- Functions to control the monitoring session ---

  const handleStartMonitoring = () => {
    if (connectedDevice && writeUUID && readUUID) {
      const newTripId = `trip_${Date.now()}`;
      setTripId(newTripId);
      console.log(`Generated new Trip ID: ${newTripId}`);
      startLiveOBDSession(
        connectedDevice,
        writeUUID,
        readUUID,
        PIDS_TO_MONITOR
      );
    }
  };

  const handleStopMonitoring = () => {
    stopLiveOBDSession();
    setTripId(null);
  };

  const handleDisconnect = () => {
    if (isMonitoring) {
      handleStopMonitoring();
    }
    if (connectedDevice) {
      manager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      setWriteUUID(null);
      setReadUUID(null);
    }
  };

  const renderOBDData = () => {
    return Object.entries(obdData).map(([name, data]) => (
      <Text key={name} style={styles.dataText}>
        {name}: {data.value.toFixed(2)} {data.unit}
      </Text>
    ));
  };

  return (
    <View style={styles.container}>
      {!connectedDevice ? (
        <>
          <Button
            title="🔍 Scan for BLE Devices"
            onPress={scanDevices}
            disabled={scanning || connecting}
          />
          {scanning && <ActivityIndicator style={{ margin: 10 }} />}
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Button
                title={`🔌 Connect: ${item.name}`}
                onPress={() => connectToDevice(item)}
                disabled={connecting}
              />
            )}
          />
        </>
      ) : (
        <>
          <Text style={styles.title}>
            ✅ Connected to: {connectedDevice.name}
          </Text>
          {tripId && <Text style={styles.subTitle}>Trip ID: {tripId}</Text>}

          <View style={styles.buttonContainer}>
            {!isMonitoring ? (
              <Button
                title="🚀 Start Monitoring"
                onPress={handleStartMonitoring}
              />
            ) : (
              <Button
                title="🛑 Stop Monitoring"
                onPress={handleStopMonitoring}
                color="orange"
              />
            )}
            <View style={{ marginTop: 10 }}>
              <Button
                title="🔌 Disconnect"
                onPress={handleDisconnect}
                color="red"
              />
            </View>
          </View>

          {isMonitoring && (
            <View style={styles.dataContainer}>
              <Text style={styles.title}>Live Data</Text>
              {renderOBDData()}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 50, flex: 1 },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  subTitle: {
    fontSize: 14,
    textAlign: 'center',
    color: 'gray',
    marginBottom: 20,
  },
  buttonContainer: { marginVertical: 10 },
  dataContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  dataText: { fontSize: 16, marginVertical: 5 },
});
