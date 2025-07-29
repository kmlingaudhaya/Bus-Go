// IP Address Finder Utility
// This helps you find the correct IP address for your development machine

export const getLocalIPAddress = async (): Promise<string[]> => {
  try {
    // This will work in web environment
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return [data.ip];
  } catch (error) {
    console.log('Could not get external IP, using common local IPs');
    return [
      '192.168.1.100',
      '192.168.1.101',
      '192.168.0.100',
      '192.168.0.101',
      '192.168.0.132',
      '10.0.2.2', // Android emulator
      'localhost', // iOS simulator
    ];
  }
};

export const testIPAddress = async (
  ip: string,
  port: number = 3001
): Promise<boolean> => {
  try {
    const response = await fetch(`http://${ip}:${port}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const findWorkingIP = async (): Promise<string | null> => {
  const ips = await getLocalIPAddress();

  for (const ip of ips) {
    console.log(`Testing IP: ${ip}`);
    const isWorking = await testIPAddress(ip);
    if (isWorking) {
      console.log(`✅ Found working IP: ${ip}`);
      return ip;
    }
  }

  console.log('❌ No working IP found');
  return null;
};

// Common IP addresses to try manually:
export const COMMON_IPS = [
  '192.168.1.100',
  '192.168.1.101',
  '192.168.0.100',
  '192.168.0.101',
  '192.168.0.132',
  '10.0.2.2', // Android emulator
  'localhost', // iOS simulator
];
