export type TripType = string;
export type BookingStatus = string;
export type PaymentStatus = string;
export type PaymentMethod = string;

export interface HotelBookingDto {
  hotelId: number;
  hotelName?: string | null;
  roomId: number;
  roomType?: string | null;
  City: string; // Backend expects capital C
  checkInDate: string;
  checkOutDate: string;
  numberOfRooms: number;
  numberOfNights?: number | null;
  pricePerNight?: number | null;
  totalPrice?: number | null;
  Status?: string;
  bookingId?: number | null; // Optional: used to add to an existing pending booking
}

// International Transport entity (matches backend)
export interface InternationalTransportDto {
  id?: number | null;
  internationalTransportType?: string | null;
  carrierName?: string | null;
  departureAirport?: string | null;
  departureAirportCode?: string | null;
  arrivalAirport?: string | null;
  arrivalAirportCode?: string | null;
  departureDate?: string | null;
  returnDate?: string | null; // Added for round trips
  arrivalDate?: string | null;
  price?: number | null;
  totalSeats?: number | null;
  availableSeats?: number | null;
  flightNumber?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  createdByUserId?: number | null;
}

// Ground Transport entity (matches backend)
export interface GroundTransportDto {
  id?: number | null;
  serviceName?: string | null;
  serviceNameAr?: string | null;
  type?: number | null; // 0 = PrivateCar, 1 = SharedBus, 2 = Taxi
  pricePerPerson?: number | null;
  description?: string | null;
  descriptionAr?: string | null;
  capacity?: number | null;
  isActive?: boolean | null;
  createdAt?: string | null;
}

// Booking DTOs for submitting transport bookings
export interface TransportBookingDto {
  transportId?: number | null;
  internationalTransportType?: string | null;
  carrierName?: string | null;
  flightNumber?: string | null;
  departureAirport?: string | null;
  departureAirportCode?: string | null;
  arrivalAirport?: string | null;
  arrivalAirportCode?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  arrivalDate?: string | null;
  numberOfSeats?: number | null;
  pricePerSeat?: number | null;
  totalPrice?: number | null;
  Status?: string;
  bookingId?: number | null; // Optional: used to add to an existing pending booking
}

export interface GroundTransportBookingDto {
  groundTransportId: number;
  serviceName?: string | null;
  serviceNameAr?: string | null;
  type?: number | null; // 0 = PrivateCar, 1 = SharedBus, 2 = Taxi
  serviceDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  numberOfPassengers: number;
  pricePerPerson?: number | null;
  capacity?: number | null;
  totalPrice?: number | null;
  Status?: string;
  bookingId?: number | null; // Optional: used to add to an existing pending booking
}

export interface TravelerDto {
  id?: number | null;
  bookingId?: number | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber: string;
  passportIssuingCountry: string;
  passportExpiryDate: string;
  nationality: string;
  gender: string;
  phoneNumber?: string | null;
  email?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  isMainTraveler?: boolean;
  photoUrl?: string | null; // Photo for visa document
}

export interface PaymentDto {
  id?: number | null;
  bookingId?: number | null;
  amount?: number | null;
  currency?: string | null;
  paymentMethod?: PaymentMethod | null;
  status?: PaymentStatus | null;
  paymentIntentId?: string | null;
  clientSecret?: string | null;
  transactionId?: string | null;
  payerEmail?: string | null;
  payerName?: string | null;
  paidAt?: string | null;
}

export interface BookingDto {
  id?: number | null;
  bookingNumber?: string | null;
  userId?: number | null;
  type: TripType;
  status?: BookingStatus | null;
  travelStartDate: string;
  travelEndDate?: string | null;
  numberOfTravelers?: number | null;
  makkahHotel?: HotelBookingDto | null;
  madinahHotel?: HotelBookingDto | null;
  internationalTransport?: TransportBookingDto | null;
  groundTransport?: GroundTransportBookingDto | null;
  travelers?: TravelerDto[] | null;
  payment?: PaymentDto | null;
  subTotal?: number | null;
  taxAmount?: number | null;
  serviceFee?: number | null;
  totalPrice?: number | null;
  paymentStatus?: PaymentStatus | null;
  paymentMethod?: PaymentMethod | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  // UI Helper properties (flattened for easier access in templates)
  makkahHotelId?: number | null;
  makkahHotelPrice?: number | null;
  madinahHotelId?: number | null;
  madinahHotelPrice?: number | null;
  internationalTransportId?: number | null;
  internationalTransportPrice?: number | null;
  groundTransportId?: number | null;
  groundTransportPrice?: number | null;
  paymentDate?: string | null;
  paymentIntentId?: string | null;
  // Navigation / detailed properties from backend
  bookingInternationalTransport?: any[]; 
  bookingGroundTransport?: any[];
  hotels?: any[]; 
}
