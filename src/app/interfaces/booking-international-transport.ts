export interface BookingInternationalTransport {
  TransportId: number;
  Type?: string;
  CarrierName?: string;
  FlightNumber?: string;
  ShiptNumber?: string;
  DepartureAirport?: string;
  ArrivalAirport?: string;
  DepartureDate?: Date;
  NumberOfSeats: number;
  PricePerSeat?: number;
  TotalPrice?: number;
}
