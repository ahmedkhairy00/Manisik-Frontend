export enum TransportType {
  BUS = 'bus',
  CAR = 'car',
  VAN = 'van',
  PRIVATE = 'private'
}
 export enum ArrivalAirport
{
    
    Jeddah='Jeddah',
    Madinah='Madinah',
    Taif='Taif'
}
 export enum DepartureAirport
 {
     
     CairoInternational='CairoInternational',        // CAI
     BorgElArabAlexandria='BorgElArabAlexandria',      // HBE
     SharmElSheikhInternational='SharmElSheikhInternational',// SSH
     HurghadaInternational='HurghadaInternational',     // HRG
     AssiutInternational='AssiutInternational',       // ATZ
     SohagInternational='SohagInternational'         // HMB
 }
export interface TransportOption {
  id: string;
  name: string;
  description: string;
  type: TransportType;
  capacity: number;
  pricePerPerson: number;
  pricePerTrip?: number;
  route: string;
  departureLocation: string;
  arrivalLocation: string;
  duration?: string;
  amenities: string[];
  imageUrl?: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransportSearchParams {
  departureLocation?: string;
  arrivalLocation?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
}

