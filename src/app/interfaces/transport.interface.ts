export enum TransportType {
  BUS = 'bus',
  CAR = 'car',
  VAN = 'van',
  PRIVATE = 'private',
}
export enum AirArrivalAirport {
  Jeddah = 'Jeddah',
  Madinah = 'Madinah',
  Taif = 'Taif',
}
export enum AirDepartureAirport {
  CairoInternational = 'Cairo', // CAI
  BorgElArabAlexandria = 'BorgElArabAlexandria', // HBE
  SharmElSheikhInternational = 'SharmElSheikh', // SSH
  HurghadaInternational = 'Hurghada', // HRG
  AssiutInternational = 'Assiut', // ATZ
  SohagInternational = 'Sohag', // HMB
}
export enum SeaDepartureAirport {
  SafagaPort = 'SafagaPort',
  AlexandriaPort = 'AlexandriaPort',
  HurghadaPort = 'HurghadaPort',
}
export enum SeaArrivalAirport {
  Jeddah = 'Jeddah',
  Madinah = 'Madinah',
}
// export interface TransportOption {
//   id: string;
//   name: string;
//   description: string;
//   type: TransportType;
//   capacity: number;
//   pricePerPerson: number;
//   pricePerTrip?: number;
//   route: string;
//   departureLocation: string;
//   arrivalLocation: string;
//   duration?: string;
//   amenities: string[];
//   imageUrl?: string;
//   available: boolean;
//   createdAt: string;
//   updatedAt: string;
//   class: string;
//   stops: string;
// }
export interface TransportOption {
  id: string | null;
  carrierName: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string;
  arrivalDate: string;
  returnDate?: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
  flightNumber: string;
  flightClass: string;
  duration: string;
  stops: string;
  internationalTransportType: string;
  isActive: boolean;
  createdAt?: string;
  createdByUserId?: string;
}

export interface TransportSearchParams {
  departureLocation?: string | null;
  arrivalLocation?: string | null;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface GroundTransport {
  id?: string;
  serviceName: string;
  type: string;
  pricePerPerson: number;
  description?: string;
  capacity: number;
  isActive: boolean;
  route: string;
  duration: string;
  rate: string;
  amenities?: string[];
}
>>>>>>> origin/main
