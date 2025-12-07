   export interface GroundTransport {
  id?: string;
  serviceName: string;
  type: string; // InternalTransportType enum value
  pricePerPerson: number;
  description?: string;
  capacity: number;
  isActive: boolean;
   }