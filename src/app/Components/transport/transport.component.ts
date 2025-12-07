import { Component, OnInit, inject } from '@angular/core';
import { I18nService } from 'src/app/core/services/i18n.service';
<<<<<<< HEAD
import { ActivatedRoute, Router } from '@angular/router';

import { MatToolbar } from '@angular/material/toolbar';
=======
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
>>>>>>> origin/main
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
<<<<<<< HEAD
import { FormsModule } from '@angular/forms';
import { ArrivalAirport, DepartureAirport } from 'src/app/interfaces/transport.interface';
=======
>>>>>>> origin/main

import { AirArrivalAirport, SeaArrivalAirport, TransportSearchParams, TransportType, AirDepartureAirport, SeaDepartureAirport, TransportOption, GroundTransport } from 'src/app/interfaces/transport.interface';
import { TransportService } from 'src/app/core/services/transport.service';
<<<<<<< HEAD
import { BookingsService } from 'src/app/core/services/bookings.service';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [
    MatToolbar,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    CommonModule
  ],
=======

@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [MatToolbarModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule, CommonModule],
>>>>>>> origin/main
  templateUrl: './transport.component.html',
  styleUrls: ['./transport.component.css']
})
<<<<<<< HEAD
export class TransportComponent implements OnInit {
  readonly i18n = inject(I18nService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly bookingsService = inject(BookingsService);
=======
export class TransportComponent {
  readonly i18n = inject(I18nService);

  arrivalAirports: string[] = Object.values(AirArrivalAirport); 
  departureAirports: string[] = Object.values(AirDepartureAirport);

  searchParams: TransportSearchParams = {
    departureLocation: null,
    arrivalLocation: null,
    departureDate: undefined,
    returnDate: undefined,
    type: 'Plane'
  };

  flights: TransportOption[] = [];
  errorMessage: string = '';

  groundTransports: GroundTransport[] = [];
  groundErrorMessage: string = '';

  constructor(private transportService: TransportService, private router: Router) {}
>>>>>>> origin/main

  // Data
  internationalTransports: any[] = [];
  filteredInternationalTransports: any[] = [];

<<<<<<< HEAD
  groundTransports: any[] = [];
  filteredGroundTransports: any[] = [];

  // Pending Bookings
  pendingGroundBooking: any = null;
  pendingTransportBooking: any = null;

  // UI State
  activeTab: 'international' | 'ground' = 'international';

  // Search Params
  internationalSearchParams: any = {
    type: 'All',
    departure: '',
    arrival: '',
    date: ''
  };

  groundSearchParams: any = {
    type: 'All',
    departure: '',
    arrival: '',
    date: ''
  };

  // Dropdown Options
  arrivalAirports: string[] = Object.values(ArrivalAirport);
  departureAirports: string[] = Object.values(DepartureAirport);

  // Mock ground locations
  groundLocations = ['Makkah', 'Madinah', 'Jeddah', 'Taif', 'Riyadh'];

  constructor(private transportService: TransportService) { }

  ngOnInit(): void {
    this.loadData();
    this.checkPendingBookings();
    
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      if (tab === 'ground' || tab === 'international') {
        this.activeTab = tab;
=======
setTransportType(type: string) {
  this.searchParams.type = type;

  // Reset select values
  this.searchParams.departureLocation = null;
  this.searchParams.arrivalLocation = null;

  if (type === 'Plane') {
    this.arrivalAirports = Object.values(AirArrivalAirport);
    this.departureAirports = Object.values(AirDepartureAirport);
  } else if (type === 'Ship') {
    this.arrivalAirports = Object.values(SeaArrivalAirport);
    this.departureAirports = Object.values(SeaDepartureAirport);
  }

  this.getAllTransportFilteredByType(type);
}
  searchflight() {
    if (this.searchParams.departureLocation && this.searchParams.arrivalLocation) {
      this.transportService
        .searchByRoute(this.searchParams.departureLocation, this.searchParams.arrivalLocation)
        .subscribe({
          next: (response) => {
            this.flights = response.data || [];
            this.errorMessage = '';
          },
          error: (err) => {
            this.errorMessage = err.error?.message || 'حدث خطأ أثناء البحث';
            this.flights = [];
          }
        });
    } else if (this.searchParams.departureDate && this.searchParams.returnDate) {
      this.transportService
        .searchByDateRange(this.searchParams.departureDate, this.searchParams.returnDate)
        .subscribe({
          next: (response) => {
            this.flights = response.data || [];
            this.errorMessage = '';
          },
          error: (err) => {
            this.errorMessage = err.error?.message || 'حدث خطأ أثناء البحث';
            this.flights = [];
          }
        });
    }
  }

  getAllTransportFilteredByType(type: string) {
    this.transportService.getTransportOptions().subscribe({
      next: (response) => {
        this.flights = response.data.filter(f => f.internationalTransportType === type);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'فشل في جلب الرحلات';
        this.flights = [];
>>>>>>> origin/main
      }
    });
  }

<<<<<<< HEAD
  checkPendingBookings() {
    // Check Ground Transport
    this.bookingsService.getMyPendingGroundBookings().subscribe({
      next: (bookings) => {
        if (bookings && bookings.length > 0) {
          this.pendingGroundBooking = bookings[0];
        }
      }
    });

    // Check International Transport
    this.bookingsService.getMyPendingTransportBookings().subscribe({
      next: (bookings) => {
        if (bookings && bookings.length > 0) {
          this.pendingTransportBooking = bookings[0];
        }
=======
  searchByType(type: string) {
    this.transportService.getTransportsByType(type).subscribe({
      next: (response) => {
        this.groundTransports = (response.data || []).map(gt => ({
          ...gt,
          amenities: gt.description?.split(',').map(a => a.trim()) || []
        }));
        this.groundErrorMessage = '';
      },
      error: (err) => {
        this.groundTransports = [];
        this.groundErrorMessage = 'حدث خطأ أثناء جلب البيانات';
        console.error(err);
>>>>>>> origin/main
      }
    });
  }

<<<<<<< HEAD
  discardGroundDraft() {
    if (!this.pendingGroundBooking) return;
    
    if (confirm(this.i18n.isRTL() ? 'هل أنت متأكد من حذف حجز النقل البري المعلق؟' : 'Are you sure you want to discard the pending ground transport booking?')) {
      this.bookingsService.deletePendingGroundBooking(this.pendingGroundBooking.id).subscribe({
        next: () => {
          this.pendingGroundBooking = null;
          this.toastr.success(
            this.i18n.isRTL() ? 'تم حذف الحجز المعلق' : 'Pending booking discarded',
            this.i18n.translate('success')
          );
        },
        error: () => {
          this.toastr.error(
            this.i18n.isRTL() ? 'فشل حذف الحجز' : 'Failed to discard booking',
            this.i18n.translate('error')
          );
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
          this.toastr.success(
            this.i18n.isRTL() ? 'تم حذف الحجز المعلق' : 'Pending booking discarded',
            this.i18n.translate('success')
          );
        },
        error: () => {
          this.toastr.error(
            this.i18n.isRTL() ? 'فشل حذف الحجز' : 'Failed to discard booking',
            this.i18n.translate('error')
          );
        }
      });
    }
  }

  loadData() {
    this.transportService.getAllInternationalTransports().subscribe({
      next: (res) => {
        if (res.success) {
          this.internationalTransports =
            this.normalizeInternationalTransports(res.data);
          this.filteredInternationalTransports = this.internationalTransports;
        }
      },
      error: (err) => console.error(err)
    });

    this.transportService.getAllGroundTransports().subscribe({
      next: (res) => {
        if (res.success) {
          this.groundTransports = this.normalizeGroundTransports(res.data);
          this.filteredGroundTransports = this.groundTransports;
        }
      },
      error: (err) => console.error(err)
    });
  }

  setActiveTab(tab: 'international' | 'ground') {
    this.activeTab = tab;
  }

  filterInternational() {
    this.filteredInternationalTransports = this.internationalTransports.filter(t => {
      const matchType = this.internationalSearchParams.type === 'All' || t.internationalTransportType === this.internationalSearchParams.type;
      const matchDeparture = !this.internationalSearchParams.departure || t.departureAirport === this.internationalSearchParams.departure;
      const matchArrival = !this.internationalSearchParams.arrival || t.arrivalAirport === this.internationalSearchParams.arrival;
      return matchType && matchDeparture && matchArrival;
    });
  }

  filterGround() {
    this.filteredGroundTransports = this.groundTransports.filter(t => {
      const matchType = this.groundSearchParams.type === 'All' || t.serviceName === this.groundSearchParams.type;
      return matchType;
    });
  }

  bookTransport(transport: any) {
    const isInternational = this.isInternationalTransport(transport);
    const targetId = this.resolveTransportId(transport, isInternational);

    if (!targetId) {
      console.error('Missing ID for transport:', transport);
      this.toastr.error(
        this.i18n.translate('toast.error.invalidTransport') || 'Invalid transport ID',
        this.i18n.translate('toast.error.title') || 'Error'
      );
      return;
    }

    const queryParams = isInternational
      ? { transportId: targetId }
      : { groundTransportId: targetId };

    const navigationState = isInternational
      ? { transport }
      : { groundTransport: transport };

    const targetRoute = isInternational ? '/booking-transport' : '/booking-ground';

    this.router
      .navigate([targetRoute], { queryParams, state: navigationState })
      .catch((err) => {
        console.error('Navigation error:', err);
        this.toastr.error(
          this.i18n.translate('toast.error.navigationFailed') ||
          'Failed to navigate to booking page',
          this.i18n.translate('toast.error.title') || 'Error'
        );
      });
  }

  private isInternationalTransport(transport: any): boolean {
    return (
      Object.prototype.hasOwnProperty.call(
        transport,
        'internationalTransportType'
      ) || Object.prototype.hasOwnProperty.call(transport, 'departureAirport')
    );
  }

  private resolveTransportId(transport: any, isInternational: boolean): number | null {
    const rawId = isInternational
      ? transport?.id ??
      transport?.transportId ??
      transport?.internationalTransportId ??
      transport?.internationalId ??
      null
      : transport?.id ??
      transport?.groundTransportId ??
      transport?.internalTransportId ??
      transport?.bookingGroundTransportId ??
      null;

    if (rawId === null || rawId === undefined) {
      return null;
    }

    const parsed = Number(rawId);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private normalizeInternationalTransports(data: any[]): any[] {
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => {
        const id = this.resolveTransportId(item, true);
        if (!id) {
          console.warn('International transport missing ID', item);
          return null;
        }
        return { ...item, id };
      })
      .filter((item): item is any => item !== null);
  }

  private normalizeGroundTransports(data: any[]): any[] {
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => {
        const id = this.resolveTransportId(item, false);
        if (!id) {
          console.warn('Ground transport missing ID', item);
          return null;
        }
        return { ...item, id };
      })
      .filter((item): item is any => item !== null);
  }
}
=======
  bookFlight(flight: any) {
    this.router.navigate(['booking/international'], { state: { selectedFlight: flight } });
  }
formatDurationString(value: string): string {
  
  if (!value) return '';

  // Split by " : " (spaces around colon)
  const parts = value.split(' : ');

  if (parts.length !== 3) return value; // fallback if format is unexpected

  const [hours, minutes, seconds] = parts;
   console.log(hours, minutes, seconds);
  return `${hours} days - ${minutes} hour - ${seconds} min`;
}

  formatPrice(price: number): string {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(price);
  }
}
>>>>>>> origin/main
