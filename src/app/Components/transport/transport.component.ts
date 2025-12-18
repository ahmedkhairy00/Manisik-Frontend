import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { I18nService } from 'src/app/core/services/i18n.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AirArrivalAirport, SeaArrivalAirport, TransportSearchParams, AirDepartureAirport, SeaDepartureAirport, TransportOption, GroundTransport } from 'src/app/interfaces/transport.interface';
import { TransportService } from 'src/app/core/services/transport.service';
import { BookingsService } from 'src/app/core/services/bookings.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    CommonModule,
    LucideAngularModule
  ],
  templateUrl: './transport.component.html',
  styleUrls: ['./transport.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransportComponent implements OnInit {
  readonly i18n = inject(I18nService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly bookingsService = inject(BookingsService);
  private readonly transportService = inject(TransportService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Active filter tracking
  activeGroundFilter: string = 'All';
  activeInternationalFilter: string = 'All';

  /**
   * Helper to merge Air and Sea airports for "All" view
   */
  get allDepartureAirports() {
    const air = Object.keys(AirDepartureAirport).map(k => ({ key: k, label: (AirDepartureAirport as any)[k] }));
    const sea = Object.keys(SeaDepartureAirport).map(k => ({ key: k, label: (SeaDepartureAirport as any)[k] }));
    return [...air, ...sea];
  }

  get allArrivalAirports() {
    const air = Object.keys(AirArrivalAirport).map(k => ({ key: k, label: (AirArrivalAirport as any)[k] }));
    const sea = Object.keys(SeaArrivalAirport).map(k => ({ key: k, label: (SeaArrivalAirport as any)[k] }));
    return [...air, ...sea];
  }

  // Airports represented as `{ key, label }` so frontend sends enum key (expected by backend)
  arrivalAirports: Array<{ key: string; label: string }> = [];
  departureAirports: Array<{ key: string; label: string }> = [];

  searchParams: TransportSearchParams = {
    departureLocation: '',
    arrivalLocation: '',
    departureDate: undefined,
    returnDate: undefined,
    type: 'All'
  };

  flights: TransportOption[] = [];
  errorMessage: string = '';

  groundTransports: GroundTransport[] = [];
  groundErrorMessage: string = '';

  // Pending Bookings
  pendingGroundBooking: any = null;
  pendingTransportBooking: any = null;


  // Theme handling removed to avoid conflict with Navbar/App component
  // isDarkTheme: boolean = false;

  constructor() { }

  ngOnInit(): void {
    // Initialize airports (default All)
    this.departureAirports = this.allDepartureAirports;
    this.arrivalAirports = this.allArrivalAirports;

    // Load all data by default
    this.loadAllGroundTransports();
    this.loadAllInternationalTransports();

    // Check pending bookings from local logic
    this.checkPendingBookings();

    // specific fix for query params
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'ground') {
        setTimeout(() => {
          const element = document.getElementById('ground-transport-section');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500); // delay to ensure rendering
      }
    });
  }

  /**
   * Loads all ground transports (default view)
   */
  loadAllGroundTransports() {
    this.activeGroundFilter = 'All';
    this.transportService.getAllGroundTransports().subscribe({
      next: (response) => {
        // Process ground transports data
        this.groundTransports = (response.data || []).map((gt: any) => ({
          ...gt,
          serviceName: gt.serviceName || gt.ServiceName,
          type: gt.type || gt.Type,
          pricePerPerson: gt.pricePerPerson || gt.PricePerPerson,
          rate: gt.rate || gt.Rate,
          route: gt.route || gt.Route,
          duration: gt.duration || gt.Duration,
          amenities: (gt.description || gt.Description)?.split(',').map((a: string) => a.trim()) || []
        }));
        // Ground transports mapped successfully
        this.groundErrorMessage = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.groundTransports = [];
        this.groundErrorMessage = 'Failed to load ground transports';
        this.cdr.markForCheck();
      }
    });
  }

  getDurationInHours(start: string, end: string): number {
    if (!start || !end) return 0;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return (endTime - startTime) / (1000 * 60 * 60);
  }

  /**
   * Loads all international transports (default view)
   */
  loadAllInternationalTransports() {
    this.transportService.getTransportOptions().subscribe({
      next: (response) => {
        this.mapFlights(response.data || []);
        this.errorMessage = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.flights = [];
        this.errorMessage = 'Failed to load international transports';
        this.cdr.markForCheck();
      }
    });
  }

  private mapFlights(data: any[]) {
     this.flights = data.map((f: any) => {
        // Enforce Round Trip: Data must have return date. If missing, default to +14 days (Umrah standard)
        let depDate = f.departureDate || f.DepartureDate || f.departure || '';
        let retDate = f.returnDate || f.ReturnDate || f.return || '';

        // If no return date, synthesize one (Departure + 14 days) to strictly support "Go and Back"
        if (depDate && !retDate) {
            const d = new Date(depDate);
            d.setDate(d.getDate() + 14);
            retDate = d.toISOString();
        }

        return {
          ...f,
          id: f.id || f.Id || f.internationalTransportId || f.InternationalTransportId,
          carrierName: f.carrierName || f.CarrierName,
          flightClass: f.flightClass || f.FlightClass,
          stops: f.stops || f.Stops,
          price: f.price || f.Price,
          duration: f.duration || f.Duration,
          internationalTransportType: f.transportType || f.TransportType || f.internationalTransportType || f.InternationalTransportType,
          departureAirport: f.departureAirport || f.DepartureAirport || f.departure || f.departureAirportCode,
          arrivalAirport: f.arrivalAirport || f.ArrivalAirport || f.arrival || f.arrivalAirportCode,
          departureDate: depDate,
          returnDate: retDate 
        };
     });
  }

  setTransportType(type: string) {
    this.activeInternationalFilter = type;
    this.searchParams.type = type;

    // Reset select values
    this.searchParams.departureLocation = '';
    this.searchParams.arrivalLocation = '';

    if (type === 'All') {
        this.departureAirports = this.allDepartureAirports;
        this.arrivalAirports = this.allArrivalAirports;
        this.loadAllInternationalTransports();
    } else if (type === 'Plane') {
      this.arrivalAirports = Object.keys(AirArrivalAirport).map(k => ({ key: k, label: (AirArrivalAirport as any)[k] }));
      this.departureAirports = Object.keys(AirDepartureAirport).map(k => ({ key: k, label: (AirDepartureAirport as any)[k] }));
      this.getAllTransportFilteredByType(type);
    } else if (type === 'Ship') {
      this.arrivalAirports = Object.keys(SeaArrivalAirport).map(k => ({ key: k, label: (SeaArrivalAirport as any)[k] }));
      this.departureAirports = Object.keys(SeaDepartureAirport).map(k => ({ key: k, label: (SeaDepartureAirport as any)[k] }));
      this.getAllTransportFilteredByType(type);
    }
  }

  searchflight() {
    const processResult = (response: any) => {
            let results = response.data || [];
            
            // Client-side filter by type if a specific type is selected
            if (this.searchParams.type && this.searchParams.type !== 'All') {
                const wanted = this.searchParams.type.toLowerCase();
                results = results.filter((f: any) => {
                    const type = (f.transportType ?? f.TransportType ?? f.internationalTransportType ?? f.InternationalTransportType ?? '').toString().toLowerCase();
                    return type === wanted;
                });
            }

            this.mapFlights(results);
            this.errorMessage = '';
            this.cdr.markForCheck();
    };

    if (this.searchParams.departureLocation && this.searchParams.arrivalLocation) {
      this.transportService
        .searchByRoute(this.searchParams.departureLocation, this.searchParams.arrivalLocation)
        .subscribe({
          next: processResult,
          error: (err) => {
            this.errorMessage = err.error?.message || 'حدث خطأ أثناء البحث';
            this.flights = [];
            this.cdr.markForCheck();
          }
        });
    } else if (this.searchParams.departureDate && this.searchParams.returnDate) {
      this.transportService
        .searchByDateRange(this.searchParams.departureDate, this.searchParams.returnDate)
        .subscribe({
          next: processResult,
          error: (err) => {
            this.errorMessage = err.error?.message || 'حدث خطأ أثناء البحث';
            this.flights = [];
            this.cdr.markForCheck();
          }
        });
    } else {
        // Validation/Fallback if empty
        this.notificationService.warning('Please select Route or Dates to search');
        // Optionally load all if empty?
        // this.setTransportType(this.searchParams.type || 'All'); 
    }
  }

  getAllTransportFilteredByType(type: string) {
    if (type === 'All') {
        this.loadAllInternationalTransports();
        return;
    }
    this.transportService.getTransportOptions().subscribe({
      next: (response) => {
        const wanted = (type || '').toString().toLowerCase();
        const filtered = (response.data || []).filter((f: any) => {
          const a = (f.transportType ?? f.TransportType ?? f.internationalTransportType ?? f.InternationalTransportType ?? '').toString().toLowerCase();
          return a === wanted;
        });
        this.mapFlights(filtered);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'فشل في جلب الرحلات';
        this.flights = [];
        this.cdr.markForCheck();
      }
    });
  }

  searchByType(type: string) {
    this.activeGroundFilter = type;
    // Call backend with the provided type string; backend may accept either numeric or string enum values.
    this.transportService.getTransportsByType(type).subscribe({
      next: (response) => {
        // Normalize/flatten returned data and ensure `type` is a consistent string we can compare in the UI.
        this.groundTransports = (response.data || []).map((gt: any) => {
          const normalizedType = (gt.type ?? gt.Type ?? gt.internalTransportType ?? gt.InternalTransportType ?? '').toString();
          return {
            ...gt,
            serviceName: gt.serviceName || gt.ServiceName,
            type: normalizedType,
            pricePerPerson: gt.pricePerPerson || gt.PricePerPerson,
            rate: gt.rate || gt.Rate,
            route: gt.route || gt.Route,
            duration: gt.duration || gt.Duration,
            amenities: (gt.description || gt.Description)?.split(',').map((a: string) => a.trim()) || []
          } as any;
        });
        this.groundErrorMessage = '';
        this.cdr.markForCheck();
      },
      error: (err) => {

        this.groundTransports = [];
        this.groundErrorMessage = 'Failed to load transport data';
        this.cdr.markForCheck();
      }
    });
  }

  bookFlight(flight: any) {
    this.router.navigate(['booking/international'], { state: { selectedFlight: flight } });
  }

  bookGroundTransport(transport: any) {
    this.router.navigate(['booking-ground'], { state: { groundTransport: transport } });
  }

  checkPendingBookings() {
    // Check Ground Transport
    this.bookingsService.getMyPendingGroundBookings().subscribe({
      next: (bookings) => {
        if (bookings && bookings.length > 0) {
          this.pendingGroundBooking = bookings[0];
          this.cdr.markForCheck();
        }
      }
    });

    // Check International Transport
    this.bookingsService.getMyPendingTransportBookings().subscribe({
      next: (bookings) => {
        if (bookings && bookings.length > 0) {
          this.pendingTransportBooking = bookings[0];
          this.cdr.markForCheck();
        }
      }
    });
  }

  discardGroundDraft() {
    if (!this.pendingGroundBooking) return;

    if (confirm(this.i18n.isRTL() ? 'هل أنت متأكد من حذف حجز النقل البري المعلق؟' : 'Are you sure you want to discard the pending ground transport booking?')) {
      this.bookingsService.deletePendingGroundBooking(this.pendingGroundBooking.id).subscribe({
        next: () => {
          this.pendingGroundBooking = null;
          this.notificationService.success(
            this.i18n.isRTL() ? 'تم حذف الحجز المعلق' : 'Pending booking discarded'
          );
          this.cdr.markForCheck();
        },
        error: () => {
          this.notificationService.error(
            this.i18n.isRTL() ? 'فشل حذف الحجز' : 'Failed to discard booking'
          );
          this.cdr.markForCheck();
        }
      });
    }
  }

  discardTransportDraft() {
    if (!this.pendingTransportBooking) return;

    if (confirm(this.i18n.isRTL() ? 'هل أنت متأكد من حذف حجز الطيران المعلق؟' : 'Are you sure you want to discard the pending flight booking?')) {
      this.bookingsService.deletePendingTransportBooking(this.pendingTransportBooking.id).subscribe({
        next: () => {
          this.pendingTransportBooking = null;
          this.notificationService.success(
            this.i18n.isRTL() ? 'تم حذف الحجز المعلق' : 'Pending booking discarded'
          );
          this.cdr.markForCheck();
        },
        error: () => {
          this.notificationService.error(
            this.i18n.isRTL() ? 'فشل حذف الحجز' : 'Failed to discard booking'
          );
          this.cdr.markForCheck();
        }
      });
    }
  }

  formatDurationString(value: string): string {
    if (!value) return '';
    // Split by " : " (spaces around colon)
    const parts = value.split(' : ');
    if (parts.length !== 3) return value; // fallback if format is unexpected
    const [hours, minutes, seconds] = parts;
    return `${hours} days - ${minutes} hour - ${seconds} min`;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(price);
  }
}
