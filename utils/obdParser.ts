// src/utils/obdParser.ts

export interface ParsedOBDData {
  name: string;
  value: number;
  unit: string;
}

// A map of PIDs to their parsing logic
const pidParsers: Record<string, (hex: string[]) => ParsedOBDData> = {
  // 010C: Engine RPM
  '0C': (hex) => ({
    name: 'Engine RPM',
    value: (parseInt(hex[0], 16) * 256 + parseInt(hex[1], 16)) / 4,
    unit: 'rpm',
  }),
  // 010D: Vehicle Speed
  '0D': (hex) => ({
    name: 'Vehicle Speed',
    value: parseInt(hex[0], 16),
    unit: 'km/h',
  }),
  // 0111: Throttle Position
  '11': (hex) => ({
    name: 'Throttle Position',
    value: (parseInt(hex[0], 16) * 100) / 255,
    unit: '%',
  }),
  // 012F: Fuel Tank Level
  '2F': (hex) => ({
    name: 'Fuel Tank Level',
    value: (parseInt(hex[0], 16) * 100) / 255,
    unit: '%',
  }),
  // Add more PIDs as needed
};

export const parseOBDResponse = (response: string): ParsedOBDData | null => {
  // Keep original logging as requested
  console.log('📬 Notification:', response);

  const cleanedResponse = response.replace(/>/g, '').trim();
  const parts = cleanedResponse.split(/\s/);

  // A successful response for a Mode 01 query starts with "41"
  if (parts[0] !== '41' || parts.length < 3) {
    return null;
  }

  const pid = parts[1];
  const dataBytes = parts.slice(2);

  if (pidParsers[pid]) {
    try {
      return pidParsers[pid](dataBytes);
    } catch (e) {
      console.error(`Error parsing PID ${pid}`, e);
      return null;
    }
  }

  return null;
};
