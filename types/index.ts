export type UserRole = 'user' | 'driver' | 'manager';

export type User = {
  user_id: number;
  username: string;
  email: string;
  role: string;
  firstname?: string | null;
  lastname?: string | null;
  dof?: string | null;
  created_at?: string | null;
  
  // Common fields
  phone_number?: string | null;
  gender?: string | null;
  address?: string | null;
  
  // Driver-specific fields
  manager_username?: string | null;
  organisation?: string | null;
  mobile_number?: string | null;
  license_number?: string | null;
  license_expire_date?: string | null;
  blood_group?: string | null;
  emergency_contact_number?: string | null;
  
  // Manager-specific fields
  organization?: string | null;
};

export interface Bus {
  id: string;
  name: string;
  number: string;
  type: 'Ordinary' | 'Express' | 'Deluxe' | 'AC' | 'Volvo';
  route: Route;
  departure: string;
  arrival: string;
  duration: string;
  fare: number;
  totalSeats: number;
  availableSeats: number;
  amenities: string[];
  rating: number;
  operator: 'TNSTC' | 'SETC' | 'MTC';
}

export interface Route {
  id: string;
  from: string;
  to: string;
  distance: string;
  stops: string[];
  routeType: 'local' | 'long_distance';
}

export interface Booking {
  id: string;
  userId: string;
  busId: string;
  passengers: Passenger[];
  seatNumbers: string[];
  totalFare: number;
  bookingDate: Date;
  journeyDate: Date;
  status: 'confirmed' | 'cancelled' | 'completed';
  qrCode: string;
  pnr: string;
  paymentMethod: 'online' | 'cash' | 'sms_bill';
}

export interface Passenger {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone?: string;
  idType?: 'aadhaar' | 'voter_id' | 'driving_license';
  idNumber?: string;
}

export interface WaitingList {
  id: string;
  userId: string;
  busId: string;
  passengers: Passenger[];
  position: number;
  createdAt: Date;
  status: 'waiting' | 'confirmed' | 'expired';
}

export interface Trip {
  id: string;
  busId: string;
  conductorId: string;
  route: Route;
  status: 'assigned' | 'accepted' | 'started' | 'completed' | 'cancelled';
  vehicleNumber: string;
  depotCode: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    locationName: string;
  };
  scheduledDeparture: Date;
  actualDeparture?: Date;
  scheduledArrival: Date;
  actualArrival?: Date;
  passengersBoarded: number;
  revenue: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'trip' | 'system' | 'delay' | 'cancellation';
  createdAt: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface Depot {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  contactNumber: string;
}

export type Complaint = {
  complaint_id: number;
  complaint_text: string;
  place: string;
  bus_number?: string | null;
  type?: string | null;
  username: string;
};

export type BusRoute = {
  route_id: number;
  from: string;
  to: string;
};

export type BusRouteDetail = {
  route_id: number;
  route: string[];
};

export type StopStatus = 'pending' | 'reached' | 'completed' | 'overdue';

export type RouteStop = {
  name: string;
  status: StopStatus;
  reachedAt?: number;
  completedAt?: number;
  duration?: number; // minutes stayed
};