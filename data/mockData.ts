import { Bus, Route, Booking, Trip, Notification, Depot } from '@/types';

// Helper to map translation key to enum value for bus type/operator
const busTypeEnum = {
  'bus_type_ordinary': 'Ordinary',
  'bus_type_express': 'Express',
  'bus_type_deluxe': 'Deluxe',
  'bus_type_ac': 'AC',
  'bus_type_volvo': 'Volvo',
};
const operatorEnum = {
  'operator_tnstc': 'TNSTC',
  'operator_setc': 'SETC',
  'operator_mtc': 'MTC',
};

// Move mock data arrays to top-level and export them
export const tamilNaduCities = [
  'chennai', 'coimbatore', 'madurai', 'tiruchirappalli', 'salem',
  'tirunelveli', 'tiruppur', 'vellore', 'erode', 'thoothukudi',
  'dindigul', 'thanjavur', 'ranipet', 'sivakasi', 'karur',
  'udhagamandalam', 'hosur', 'nagercoil', 'kanchipuram', 'kumbakonam',
  'palani', 'pollachi', 'pudukkottai', 'rajapalayam', 'virudhunagar',
  'cuddalore', 'tiruvannamalai', 'krishnagiri', 'namakkal', 'dharmapuri'
];

export const mockDepots: Depot[] = [
  {
    id: '1',
    name: 'chennai_central',
    code: 'CHN001',
    city: 'chennai',
    address: 'chennai_central_address',
    contactNumber: '+91-44-25361234'
  },
  {
    id: '2',
    name: 'madurai_main',
    code: 'MDU001',
    city: 'madurai',
    address: 'madurai_main_address',
    contactNumber: '+91-452-2345678'
  },
  {
    id: '3',
    name: 'coimbatore_central',
    code: 'CBE001',
    city: 'coimbatore',
    address: 'coimbatore_central_address',
    contactNumber: '+91-422-2345678'
  }
];

export const mockRoutes: Route[] = [
  {
    id: '1',
    from: 'chennai',
    to: 'madurai',
    distance: 'chennai_madurai',
    stops: ['tindivanam', 'villupuram', 'tiruchirappalli', 'dindigul'],
    routeType: 'long_distance'
  },
  {
    id: '2',
    from: 'chennai',
    to: 'coimbatore',
    distance: 'chennai_coimbatore',
    stops: ['kanchipuram', 'vellore', 'salem', 'erode'],
    routeType: 'long_distance'
  },
  {
    id: '3',
    from: 'chennai',
    to: 'kanchipuram',
    distance: 'chennai_kanchipuram',
    stops: ['tambaram', 'chengalpattu', 'madurantakam'],
    routeType: 'local'
  },
  {
    id: '4',
    from: 'madurai',
    to: 'tirunelveli',
    distance: 'madurai_tirunelveli',
    stops: ['virudhunagar', 'rajapalayam', 'srivilliputhur'],
    routeType: 'long_distance'
  },
  {
    id: '5',
    from: 'coimbatore',
    to: 'udhagamandalam',
    distance: 'coimbatore_udhagamandalam',
    stops: ['mettupalayam', 'coonoor'],
    routeType: 'local'
  }
];

export const mockBuses: Bus[] = [
  {
    id: '1',
    name: 'chennai_madurai_express',
    number: 'TN 09 Z 1234',
    type: 'Express',
    route: mockRoutes[0],
    departure: '06:00',
    arrival: '14:30',
    duration: '8h 30m',
    fare: 280,
    totalSeats: 52,
    availableSeats: 15,
    amenities: ['charging_point', 'water_bottle', 'first_aid'],
    rating: 4.3,
    operator: 'TNSTC'
  },
  {
    id: '2',
    name: 'pallavan_express',
    number: 'TN 07 Y 5678',
    type: 'Deluxe',
    route: mockRoutes[0],
    departure: '08:30',
    arrival: '16:45',
    duration: '8h 15m',
    fare: 320,
    totalSeats: 45,
    availableSeats: 8,
    amenities: ['ac', 'charging_point', 'water_bottle', 'snacks'],
    rating: 4.5,
    operator: 'SETC'
  },
  {
    id: '3',
    name: 'kovai_express',
    number: 'TN 11 X 9012',
    type: 'AC',
    route: mockRoutes[1],
    departure: '22:00',
    arrival: '06:30',
    duration: '8h 30m',
    fare: 450,
    totalSeats: 40,
    availableSeats: 5,
    amenities: ['ac', 'wifi', 'blanket', 'charging_point', 'entertainment'],
    rating: 4.7,
    operator: 'TNSTC'
  },
  {
    id: '4',
    name: 'local_service',
    number: 'TN 09 W 3456',
    type: 'Ordinary',
    route: mockRoutes[2],
    departure: '07:00',
    arrival: '09:30',
    duration: '2h 30m',
    fare: 45,
    totalSeats: 60,
    availableSeats: 22,
    amenities: ['basic_seating'],
    rating: 3.8,
    operator: 'MTC'
  },
  {
    id: '5',
    name: 'nilgiri_hills_special',
    number: 'TN 11 V 7890',
    type: 'Volvo',
    route: mockRoutes[4],
    departure: '07:00',
    arrival: '09:30',
    duration: '2h 30m',
    fare: 120,
    totalSeats: 35,
    availableSeats: 0,
    amenities: ['ac', 'comfortable_seating', 'scenic_route'],
    rating: 4.8,
    operator: 'TNSTC'
  }
];

export const mockBookings: Booking[] = [
  {
    id: '1',
    userId: '1',
    busId: '1',
    passengers: [
      { name: 'rajesh_kumar', age: 30, gender: 'Male', phone: '+919876543210' },
      { name: 'priya_rajesh', age: 28, gender: 'Female' }
    ],
    seatNumbers: ['A1', 'A2'],
    totalFare: 560,
    bookingDate: new Date(),
    journeyDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: 'confirmed',
    qrCode: 'TNSTC123456789',
    pnr: 'TNSTC123456',
    paymentMethod: 'online'
  }
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    title: 'notif_booking_confirmed',
    message: 'notif_booking_confirmed_msg',
    type: 'booking',
    createdAt: new Date(),
    read: false,
    priority: 'high'
  },
  {
    id: '2',
    userId: '1',
    title: 'notif_bus_delayed',
    message: 'notif_bus_delayed_msg',
    type: 'delay',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    priority: 'medium'
  },
  {
    id: '3',
    userId: '2',
    title: 'notif_trip_assignment',
    message: 'notif_trip_assignment_msg',
    type: 'trip',
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    read: true,
    priority: 'high'
  }
];

export const busOperators = ['TNSTC', 'SETC', 'MTC'];
export const busTypes = ['Ordinary', 'Express', 'Deluxe', 'AC', 'Volvo'];

export function getLocalizedMockData(t: (key: string, options?: any) => string) {
  // Remove all t() calls. Use IDs/keys for all filterable fields.
  return {
    tamilNaduCities,
    mockDepots,
    mockRoutes,
    mockBuses,
    mockBookings,
    mockNotifications,
    busOperators,
    busTypes
  };
}