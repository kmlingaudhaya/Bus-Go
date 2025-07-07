import { Bus, Route, Booking, Trip, Notification, Depot } from '@/types';

export const tamilNaduCities = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
  'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukudi',
  'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur',
  'Udhagamandalam', 'Hosur', 'Nagercoil', 'Kanchipuram', 'Kumbakonam',
  'Palani', 'Pollachi', 'Pudukkottai', 'Rajapalayam', 'Virudhunagar',
  'Cuddalore', 'Tiruvannamalai', 'Krishnagiri', 'Namakkal', 'Dharmapuri'
];

export const mockDepots: Depot[] = [
  {
    id: '1',
    name: 'Chennai Central Depot',
    code: 'CHN001',
    city: 'Chennai',
    address: 'Poonamallee High Road, Chennai - 600003',
    contactNumber: '+91-44-25361234'
  },
  {
    id: '2',
    name: 'Madurai Main Depot',
    code: 'MDU001',
    city: 'Madurai',
    address: 'Mattuthavani Bus Stand, Madurai - 625020',
    contactNumber: '+91-452-2345678'
  },
  {
    id: '3',
    name: 'Coimbatore Central',
    code: 'CBE001',
    city: 'Coimbatore',
    address: 'Gandhipuram Central Bus Stand, Coimbatore - 641012',
    contactNumber: '+91-422-2345678'
  }
];

export const mockRoutes: Route[] = [
  {
    id: '1',
    from: 'Chennai',
    to: 'Madurai',
    distance: '460 km',
    stops: ['Tindivanam', 'Villupuram', 'Tiruchirappalli', 'Dindigul'],
    routeType: 'long_distance'
  },
  {
    id: '2',
    from: 'Chennai',
    to: 'Coimbatore',
    distance: '500 km',
    stops: ['Kanchipuram', 'Vellore', 'Salem', 'Erode'],
    routeType: 'long_distance'
  },
  {
    id: '3',
    from: 'Chennai',
    to: 'Kanchipuram',
    distance: '75 km',
    stops: ['Tambaram', 'Chengalpattu', 'Madurantakam'],
    routeType: 'local'
  },
  {
    id: '4',
    from: 'Madurai',
    to: 'Tirunelveli',
    distance: '150 km',
    stops: ['Virudhunagar', 'Rajapalayam', 'Srivilliputhur'],
    routeType: 'long_distance'
  },
  {
    id: '5',
    from: 'Coimbatore',
    to: 'Udhagamandalam',
    distance: '85 km',
    stops: ['Mettupalayam', 'Coonoor'],
    routeType: 'local'
  }
];

export const mockBuses: Bus[] = [
  {
    id: '1',
    name: 'Chennai - Madurai Express',
    number: 'TN 09 Z 1234',
    type: 'Express',
    route: mockRoutes[0],
    departure: '06:00',
    arrival: '14:30',
    duration: '8h 30m',
    fare: 280,
    totalSeats: 52,
    availableSeats: 15,
    amenities: ['Charging Point', 'Water Bottle', 'First Aid'],
    rating: 4.3,
    operator: 'TNSTC'
  },
  {
    id: '2',
    name: 'Pallavan Express',
    number: 'TN 07 Y 5678',
    type: 'Deluxe',
    route: mockRoutes[0],
    departure: '08:30',
    arrival: '16:45',
    duration: '8h 15m',
    fare: 320,
    totalSeats: 45,
    availableSeats: 8,
    amenities: ['AC', 'Charging Point', 'Water Bottle', 'Snacks'],
    rating: 4.5,
    operator: 'SETC'
  },
  {
    id: '3',
    name: 'Kovai Express',
    number: 'TN 11 X 9012',
    type: 'AC',
    route: mockRoutes[1],
    departure: '22:00',
    arrival: '06:30',
    duration: '8h 30m',
    fare: 450,
    totalSeats: 40,
    availableSeats: 5,
    amenities: ['AC', 'WiFi', 'Blanket', 'Charging Point', 'Entertainment'],
    rating: 4.7,
    operator: 'TNSTC'
  },
  {
    id: '4',
    name: 'Local Service',
    number: 'TN 09 W 3456',
    type: 'Ordinary',
    route: mockRoutes[2],
    departure: '07:00',
    arrival: '09:30',
    duration: '2h 30m',
    fare: 45,
    totalSeats: 60,
    availableSeats: 22,
    amenities: ['Basic Seating'],
    rating: 3.8,
    operator: 'MTC'
  },
  {
    id: '5',
    name: 'Nilgiri Hills Special',
    number: 'TN 11 V 7890',
    type: 'Volvo',
    route: mockRoutes[4],
    departure: '07:00',
    arrival: '09:30',
    duration: '2h 30m',
    fare: 120,
    totalSeats: 35,
    availableSeats: 0,
    amenities: ['AC', 'Comfortable Seating', 'Scenic Route'],
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
      { name: 'Rajesh Kumar', age: 30, gender: 'Male', phone: '+919876543210' },
      { name: 'Priya Rajesh', age: 28, gender: 'Female' }
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

export const mockTrips: Trip[] = [
  {
    id: '1',
    busId: '1',
    conductorId: '2',
    route: mockRoutes[0],
    status: 'assigned',
    vehicleNumber: 'TN 09 Z 1234',
    depotCode: 'CHN001',
    scheduledDeparture: new Date(Date.now() + 2 * 60 * 60 * 1000),
    scheduledArrival: new Date(Date.now() + 10 * 60 * 60 * 1000),
    passengersBoarded: 0,
    revenue: 0,
    currentLocation: {
      latitude: 13.0827,
      longitude: 80.2707,
      locationName: 'Chennai Central'
    }
  },
  {
    id: '2',
    busId: '2',
    conductorId: '2',
    route: mockRoutes[1],
    status: 'started',
    vehicleNumber: 'TN 07 Y 5678',
    depotCode: 'MDU001',
    scheduledDeparture: new Date(Date.now() - 1 * 60 * 60 * 1000),
    scheduledArrival: new Date(Date.now() + 7 * 60 * 60 * 1000),
    passengersBoarded: 10,
    revenue: 1500,
    currentLocation: {
      latitude: 11.0168,
      longitude: 76.9558,
      locationName: 'Coimbatore Junction'
    }
  }
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    title: 'Booking Confirmed',
    message: 'Your ticket for Chennai to Madurai has been confirmed. PNR: TNSTC123456',
    type: 'booking',
    createdAt: new Date(),
    read: false,
    priority: 'high'
  },
  {
    id: '2',
    userId: '1',
    title: 'Bus Delayed',
    message: 'Chennai - Madurai Express is delayed by 30 minutes due to traffic.',
    type: 'delay',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    priority: 'medium'
  },
  {
    id: '3',
    userId: '2',
    title: 'Trip Assignment',
    message: 'You have been assigned to Chennai - Madurai Express departing at 06:00.',
    type: 'trip',
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    read: true,
    priority: 'high'
  }
];

export const busOperators = ['TNSTC', 'SETC', 'MTC'];
export const busTypes = ['Ordinary', 'Express', 'Deluxe', 'AC', 'Volvo'];