import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CacheService } from 'src/app/core/services/cache.service';
import { I18nService } from 'src/app/core/services/i18n.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { BookingsService } from 'src/app/core/services/bookings.service';
import { ToastrService } from 'ngx-toastr';
import { BookingDto, UserDto, AssignRoleDto, HotelDto, RoomDto } from 'src/app/models/api';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { HotelsService } from 'src/app/core/services/hotels.service';
import { PaymentService } from 'src/app/core/services/payment.service';
import { CreatePaymentRequest } from 'src/app/interfaces/payment.interface';
import { loadStripe, Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';

import { LucideAngularModule } from 'lucide-angular';

// Extended DTOs for dashboard-specific needs
export interface DashboardUserDto extends UserDto {
  fullName: string;
  isActive: boolean;
}

// Transport DTOs (not yet in shared models)
export interface InternationalTransportDto {
  id?: number;
  transportType: string;
  carrierName: string;
  departureAirport: string;
  departureAirportCode?: string;
  arrivalAirport: string;
  arrivalAirportCode?: string;
  departureDate: string;
  arrivalDate: string;
  price: number;
  totalSeats?: number;
  availableSeats: number;
  flightNumber?: string;
  duration?: string;
  stops?: string;
  flightClass?: string;
  isActive?: boolean;
  createdAt?: string;
  createdByUserId?: number;
}

export interface GroundTransportDto {
  id?: number;
  serviceName: string;
  serviceNameAr?: string;
  type: string; // 'PrivateCar', 'SharedBus', 'Taxi'
  pricePerPerson: number;
  description?: string;
  descriptionAr?: string;
  capacity: number;
  isActive?: boolean;
  createdAt?: string;
  route?: string;
  duration?: string;
  rate?: string;
}

// -----------------------
// Dashboard Component
// -----------------------
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  providers: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // ----- Injected services -----
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);
  readonly bookings = inject(BookingsService);
  readonly toastr = inject(ToastrService);
  readonly http = inject(HttpClient);
  readonly router = inject(Router);
  readonly hotels = inject(HotelsService);
  readonly paymentService = inject(PaymentService);
  readonly cacheService = inject(CacheService);

  // ----- Initial model defaults -----
  hotel: HotelDto = {
    name: '',
    description: '',
    address: '',
    city: 'Makkah',
    pricePerNight: 0,
    availableRooms: 0,
    amenities: '',
    isActive: true,
    starRating: 3,
    distanceToHaram: 0,
    imageUrl: ''
  };

  // ----- Signals / State -----
  currentUser = signal<any>(null);
  role = signal<string | null>(null);
  activeView = signal<'overview' | 'bookings' | 'users' | 'hotels' | 'international-transport' | 'ground-transport'>('overview');

  // Payment Modal State
  isPaymentModalOpen = false;
  selectedBookingForPayment: BookingDto | null = null;
  paymentAmount: number = 0;
  stripePromise = loadStripe(environment.stripe.publishableKey);
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  cardElement: StripeCardElement | null = null;
  cardErrors: string = '';
  isProcessingPayment = false;
  cardHolderName = '';

  loading = signal<boolean>(false);
  usersLoading = signal<boolean>(false);
  bookingsLoading = signal<boolean>(false);

  allBookings = signal<BookingDto[]>([]);
  myBookings = signal<BookingDto[]>([]);
  allUsers = signal<UserDto[]>([]);
  usersByRole = signal<UserDto[]>([]);

  bookingStatusFilter = signal<string>('all');
  userRoleFilter = signal<string>('all');
  searchQuery = signal<string>('');

  selectedUser = signal<UserDto | null>(null);
  roleToAssign = signal<string>('User');
  showRoleModal = signal<boolean>(false);

  // Hotel management
  allHotels = signal<HotelDto[]>([]);
  myHotels = signal<HotelDto[]>([]);
  hotelsLoading = signal<boolean>(false);
  selectedHotel = signal<HotelDto | null>(null);
  showHotelModal = signal<boolean>(false);

  // User menu state
  showUserMenu = signal<boolean>(false);

  // Form backing objects (plain objects to work with ngModel)
  hotelFormData: HotelDto = {
    name: '',
    address: '',
    city: 'Makkah',
    pricePerNight: 0,
    availableRooms: 0,
    starRating: 3,
    distanceToHaram: 0,
    description: '',
    descriptionAr: '',
    amenities: ''
  } as HotelDto;
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;

  // International transport
  allInternationalTransports = signal<InternationalTransportDto[]>([]);
  internationalTransportsLoading = signal<boolean>(false);
  selectedInternationalTransport = signal<InternationalTransportDto | null>(null);
  showInternationalTransportModal = signal<boolean>(false);
  roomTypes = signal<string[]>([]);

  // Dropdown options for International Transport form
  departureAirports = [
    { value: 'Cairo', label: 'Cairo (CAI)' },
    { value: 'BorgElArabAlexandria', label: 'Alexandria - Borg El Arab (HBE)' },
    { value: 'SharmElSheikh', label: 'Sharm El Sheikh (SSH)' },
    { value: 'Hurghada', label: 'Hurghada (HRG)' },
    { value: 'Assiut', label: 'Assiut (ATZ)' },
    { value: 'Sohag', label: 'Sohag (HMB)' },
    { value: 'SafagaPort', label: 'Safaga Port' },
    { value: 'AlexandriaPort', label: 'Alexandria Port' },
    { value: 'HurghadaPort', label: 'Hurghada Port' }
  ];

  arrivalAirports = [
    { value: 'Jeddah', label: 'Jeddah (JED)' },
    { value: 'Madinah', label: 'Madinah (MED)' },
    { value: 'Taif', label: 'Taif (TIF)' }
  ];

  airlineCompanies = [
    { value: 'Saudia', label: 'Saudia' },
    { value: 'EgyptAir', label: 'EgyptAir' },
    { value: 'Flynas', label: 'Flynas' },
    { value: 'AirCairo', label: 'Air Cairo' },
    { value: 'NileAir', label: 'Nile Air' }
  ];

  internationalTransportFormData: InternationalTransportDto = {
    carrierName: '',
    transportType: 'Plane',
    departureAirport: '',
    departureAirportCode: '',
    arrivalAirport: '',
    arrivalAirportCode: '',
    departureDate: '',
    arrivalDate: '',
    price: 0,
    totalSeats: 0,
    availableSeats: 0,
    flightNumber: '',
    isActive: true
  } as InternationalTransportDto;

  // Ground transport
  allGroundTransports = signal<GroundTransportDto[]>([]);
  groundTransportsLoading = signal<boolean>(false);
  selectedGroundTransport = signal<GroundTransportDto | null>(null);
  showGroundTransportModal = signal<boolean>(false);

  // Booking details modal
  showBookingDetailsModal = signal<boolean>(false);
  selectedBookingDetails = signal<BookingDto | null>(null);

  // Delete confirmation modal
  showDeleteConfirmModal = signal<boolean>(false);
  deleteConfirmConfig = signal<{
    title: string;
    message: string;
    entityType: string;
    entityId: number | null;
    onConfirm: (() => void) | null;
  }>({
    title: '',
    message: '',
    entityType: '',
    entityId: null,
    onConfirm: null
  });

  groundTransportFormData: GroundTransportDto = {
    serviceName: '',
    serviceNameAr: '',
    type: 'PrivateCar',
    pricePerPerson: 0,
    description: '',
    descriptionAr: '',
    capacity: 0,
    isActive: true,
    route: '',
    duration: ''
  } as GroundTransportDto;

  // Broadcast Modal
  showBroadcastModal = signal<boolean>(false);
  broadcastSubject = signal<string>('');
  broadcastBody = signal<string>('');
  isSendingBroadcast = signal<boolean>(false);

  openBroadcastModal() {
    this.broadcastSubject.set('');
    this.broadcastBody.set('');
    this.showBroadcastModal.set(true);
  }

  closeBroadcastModal() {
    this.showBroadcastModal.set(false);
  }

  sendBroadcast() {
    if (!this.broadcastSubject() || !this.broadcastBody()) {
      this.toastr.warning('Please enter both subject and body');
      return;
    }

    if (!confirm('Are you sure you want to send this email to ALL subscribers and users?')) return;

    this.isSendingBroadcast.set(true);
    const payload = {
      subject: this.broadcastSubject(),
      body: this.broadcastBody()
    };

    this.http.post(`${environment.apiUrl}/Subscriber/Broadcast`, payload, { withCredentials: true }).subscribe({
      next: (res: any) => {
        this.toastr.success(res.message || 'Broadcast queued successfully');
        this.closeBroadcastModal();
        this.isSendingBroadcast.set(false);
      },
      error: (err) => {
        console.error('Failed to send broadcast', err);
        this.toastr.error('Failed to send broadcast');
        this.isSendingBroadcast.set(false);
      }
    });
  }

  // ----- Computed properties -----
  stats = computed(() => {
    const bookings = this.role() === 'Admin' ? this.allBookings() : this.myBookings();
    const confirmed = bookings.filter(b => b.status === 'Confirmed').length;
    const pending = bookings.filter(b => b.status === 'Pending').length;
    const cancelled = bookings.filter(b => b.status === 'Cancelled').length;

    return {
      total: bookings.length,
      confirmed,
      pending,
      cancelled,
      users: this.allUsers().length,
      hotels: this.allHotels().length,
      internationalTransports: this.allInternationalTransports().length,
      groundTransports: this.allGroundTransports().length
    };
  });

  upcomingTrips = computed(() => {
    const bookings = this.role() === 'Admin' ? this.allBookings() : this.myBookings();
    const upcoming = bookings
      .filter(b => b.status === 'Confirmed')
      .map(b => ({
        type: this.getBookingType(b),
        destination: 'Makkah & Madinah',
        hotel: 'N/A',
        status: b.status || 'Unknown',
        daysLeft: this.calculateDaysLeft(b.createdAt)
      }));
    return upcoming.slice(0, 3);
  });

  recentActivity = computed(() => {
    const bookings = this.role() === 'Admin' ? this.allBookings() : this.myBookings();
    return bookings.slice(0, 5).map(b => ({
      action: b.status === 'Confirmed' ? 'Confirmed' : b.status === 'Pending' ? 'Pending' : 'Cancelled',
      item: `Booking #${b.bookingNumber || b.id}`,
      time: this.getTimeAgo(b.createdAt)
    }));
  });

  filteredBookings = computed(() => {
    let bookings = this.role() === 'Admin' ? this.allBookings() : this.myBookings();

    if (this.bookingStatusFilter() !== 'all') {
      bookings = bookings.filter(b => b.status === this.bookingStatusFilter());
    }

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      bookings = bookings.filter(b =>
        (b.id?.toString().includes(query) || false) ||
        (b.status?.toLowerCase().includes(query) || false) ||
        (b.bookingNumber?.toLowerCase().includes(query) || false)
      );
    }

    return bookings;
  });

  // ----- Helpers -----
  mapUiProperties(booking: any): BookingDto {
    if (!booking) return booking;
    return {
      ...booking,
      travelStartDate: booking.travelStartDate || booking.TravelStartDate,
      travelEndDate: booking.travelEndDate || booking.TravelEndDate,
      travelers: booking.travelers || booking.Travelers || [],
      makkahHotelId: booking.makkahHotel?.hotelId,
      makkahHotelPrice: booking.makkahHotel?.totalPrice,
      madinahHotelId: booking.madinahHotel?.hotelId,
      madinahHotelPrice: booking.madinahHotel?.totalPrice,
      internationalTransportId: booking.internationalTransport?.transportId || booking.internationalTransport?.id,
      internationalTransportPrice: booking.internationalTransport?.totalPrice || booking.internationalTransport?.price,
      groundTransportId: booking.groundTransport?.groundTransportId || booking.groundTransport?.id,
      groundTransportPrice: booking.groundTransport?.totalPrice,
      paymentDate: booking.payment?.paidAt || booking.paymentDate,
      taxAmount: booking.taxAmount || booking.TaxAmount || 0,
      serviceFee: booking.serviceFee || booking.ServiceFee || 0,
      totalPrice: booking.totalPrice || booking.TotalPrice || 0
    } as BookingDto;
  }

  /**
   * Get the booking type display string
   * @param booking - The booking to get type for
   * @returns 'Hajj', 'Umrah', or 'Unknown'
   */
  getBookingType(booking: BookingDto | null): string {
    if (!booking) return 'Unknown';
    // Handle various possible backend formats (number 0/1, string "0"/"1", string "Umrah"/"Hajj")
    const val = booking.type || (booking as any).Type || (booking as any).tripType;

    const sVal = String(val).toLowerCase();
    if (val === 1 || sVal === '1' || sVal === 'hajj') return 'Hajj';
    if (val === 0 || sVal === '0' || sVal === 'umrah') return 'Umrah';

    return String(val || 'Unknown');
  }

  calculateDaysLeft(dateStr?: string | null): number {
    if (!dateStr) return 0;
    const travelDate = new Date(dateStr);
    const today = new Date();
    const timeDiff = travelDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  getTimeAgo(dateStr?: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  }

  // Booking Details Modal Methods
  viewBookingDetails(booking: BookingDto) {
    this.selectedBookingDetails.set(booking);
    this.showBookingDetailsModal.set(true);
  }

  closeBookingDetailsModal() {
    this.showBookingDetailsModal.set(false);
    this.selectedBookingDetails.set(null);
  }

  // Download Visa or Ticket PDF for a traveler
  downloadDocument(booking: BookingDto, traveler: any, documentType: 'visa' | 'ticket') {
    const bookingId = booking.id;
    const travelerId = traveler.id;
    if (!bookingId || !travelerId) {
      this.toastr.error('Missing booking or traveler information');
      return;
    }

    this.toastr.info(`Downloading ${documentType === 'visa' ? 'Visa' : 'Ticket'}...`);

    this.bookings.downloadDocument(bookingId, travelerId, documentType).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentType === 'visa' ? 'Visa' : 'Ticket'}_${traveler.firstName}_${traveler.lastName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toastr.success(`${documentType === 'visa' ? 'Visa' : 'Ticket'} downloaded successfully`);
      },
      error: (err) => {
        console.error('Download failed', err);
        this.toastr.error('Download failed. Please try again. ' + (err?.message || err?.statusText || ''));
      }
    });
  }

  filteredUsers = computed(() => {
    let users = this.allUsers();

    if (this.userRoleFilter() !== 'all') {
      users = users.filter(u => u.roles?.includes(this.userRoleFilter()));
    }

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      users = users.filter(u =>
        u.email.toLowerCase().includes(query) ||
        (u.fullName || `${u.firstName} ${u.lastName}`).toLowerCase().includes(query)
      );
    }

    return users;
  });

  displayedHotels = computed(() => this.role() === 'HotelManager' ? this.myHotels() : this.allHotels());



  // ----- Performance TrackBy Functions -----
  trackByBookingId(index: number, item: BookingDto): any {
    return item.id || index;
  }

  trackByUserId(index: number, item: UserDto): any {
    return item.id || index;
  }

  trackByHotelId(index: number, item: HotelDto): any {
    return item.id || index;
  }

  trackByIntTransportId(index: number, item: InternationalTransportDto): any {
    return item.id || index;
  }

  trackByGroundTransportId(index: number, item: GroundTransportDto): any {
    return item.id || index;
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }

  // ----- Lifecycle -----
  ngOnInit() {
    this.auth.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      const userRole = user?.roles?.[0] ?? null;
      this.role.set(userRole);

      if (user) {
        this.loadDashboardData();
      }
    });
  }

  // ----- Data loading orchestration -----
  private loadDashboardData() {
    const userRole = this.role();

    if (userRole === 'User') {
      this.loadMyBookings();
    } else if (userRole === 'Admin') {
      this.loadAllBookings();
      this.loadAllUsers();
      this.loadHotels();
      this.loadInternationalTransports();
      this.loadInternationalTransports();
      this.loadGroundTransports();
      this.loadRoomTypes();
    } else if (userRole === 'HotelManager') {
      this.loadMyBookings();
      this.loadHotels();
      this.loadRoomTypes();
    }
  }

  // ----- Bookings -----
  loadMyBookings() {
    this.bookingsLoading.set(true);
    this.bookings.getMyBookingsWithCache().subscribe({
      next: (bookings) => {
        this.myBookings.set(bookings.map(b => this.mapUiProperties(b)));
        this.bookingsLoading.set(false);
      },
      error: (err) => {

        this.toastr.error('Failed to load bookings');
        this.bookingsLoading.set(false);
      }
    });
  }

  updateBookingStatus(id: number, status: string): void {
    this.toastr.info(this.i18n.t('dashboard.updatingStatus') || 'Updating status...');
    this.bookings.updateStatus(String(id), status).subscribe({
      next: (res: any) => {
        // Show success message from backend if available (which might include email status)
        this.toastr.success(res.message || 'Status updated successfully');

        // Optimistic update to reduce perceived lag
        // Update local lists immediately without waiting for full reload
        const updateList = (list: BookingDto[]) => list.map(b => b.id === id ? { ...b, status } : b);
        this.allBookings.update(list => updateList(list));
        this.myBookings.update(list => updateList(list));

        // Use setTimeout to reload in background to ensure consistency, but UI is already updated
        setTimeout(() => this.loadAllBookings(), 500);
      },
      error: err => {
        this.toastr.error(err?.error?.message || 'Failed to update status');
        // Revert optimistic update if necessary (reloading handles it)
        this.loadAllBookings();
      }
    });
  }

  deleteHotel(id: number): void {
    this.openDeleteConfirm(
      'Delete Hotel',
      'Are you sure you want to delete this hotel? This action cannot be undone.',
      'hotel',
      id,
      () => {
        this.hotels.deleteHotel(String(id)).subscribe({
          next: () => {
            this.toastr.success('Hotel deleted successfully');
            this.loadHotels();
          },
          error: err => {
            this.toastr.error('Failed to delete hotel');
          }
        });
      }
    );
  }

  // Open delete confirmation modal
  openDeleteConfirm(title: string, message: string, entityType: string, entityId: number, onConfirm: () => void): void {
    this.deleteConfirmConfig.set({
      title,
      message,
      entityType,
      entityId,
      onConfirm
    });
    this.showDeleteConfirmModal.set(true);
  }

  // Confirm delete action
  confirmDelete(): void {
    const config = this.deleteConfirmConfig();
    if (config.onConfirm) {
      config.onConfirm();
    }
    this.showDeleteConfirmModal.set(false);
  }

  // Cancel delete action
  cancelDelete(): void {
    this.showDeleteConfirmModal.set(false);
  }


  loadAllBookings() {
    this.bookingsLoading.set(true);
    this.bookings.getAllBookings().subscribe({
      next: (bookings) => {
        this.allBookings.set(bookings.map(b => this.mapUiProperties(b)));
        this.bookingsLoading.set(false);
      },
      error: (err) => {

        this.toastr.error('Failed to load all bookings');
        this.bookingsLoading.set(false);
      }
    });
  }

  async openPaymentModal(booking: BookingDto) {
    this.selectedBookingForPayment = { ...booking }; // Create a copy

    // Calculate total if it's 0 or missing
    if (!this.selectedBookingForPayment.totalPrice || this.selectedBookingForPayment.totalPrice === 0) {
      const makkahPrice = this.selectedBookingForPayment.makkahHotelPrice || 0;
      const madinahPrice = this.selectedBookingForPayment.madinahHotelPrice || 0;
      const intTransportPrice = this.selectedBookingForPayment.internationalTransportPrice || 0;
      const groundTransportPrice = this.selectedBookingForPayment.groundTransportPrice || 0;
      const tax = this.selectedBookingForPayment.taxAmount || 0;
      const fee = this.selectedBookingForPayment.serviceFee || 0;

      this.selectedBookingForPayment.totalPrice = makkahPrice + madinahPrice + intTransportPrice + groundTransportPrice + tax + fee;
    }

    this.paymentAmount = this.selectedBookingForPayment.totalPrice || 0;
    this.isPaymentModalOpen = true;

    // Pre-fill card holder name
    const user = this.currentUser();
    if (user) {
      this.cardHolderName = user.fullName || `${user.firstName} ${user.lastName}`.trim();
    }

    // Tiny delay to ensure modal DOM is present
    setTimeout(() => {
      this.initStripeCard();
    }, 100);
  }

  closePaymentModal() {
    this.isPaymentModalOpen = false;
    this.selectedBookingForPayment = null;
    this.cardErrors = '';
    this.cardHolderName = '';

    if (this.cardElement) {
      this.cardElement.destroy();
      this.cardElement = null;
    }
  }

  async initStripeCard() {
    this.stripe = await this.stripePromise;
    if (!this.stripe) {

      return;
    }

    this.elements = this.stripe.elements();
    this.cardElement = this.elements.create('card', {
      hidePostalCode: true,
      style: {
        base: {
          fontSize: '16px',
          color: '#32325d',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a',
        },
      },
    });

    this.cardElement.mount('#card-element');

    this.cardElement.on('change', (event) => {
      this.cardErrors = event.error ? event.error.message : '';
    });
  }

  async processPayment() {
    if (!this.stripe || !this.cardElement || !this.selectedBookingForPayment) return;

    this.isProcessingPayment = true;
    this.cardErrors = '';

    try {
      // 1. Create Payment Intent
      const payload: CreatePaymentRequest = {
        bookingId: this.selectedBookingForPayment.id!,
        amount: this.selectedBookingForPayment.totalPrice || undefined,
        currency: (environment.stripe.currency || 'usd').toLowerCase(),
        idempotencyKey: `dash-pay-${this.selectedBookingForPayment.id}-${Date.now()}`
      };

      // We need lastValueFrom or similar, assuming createPayment returns Observable
      // For now using subscribe logic converted to promise or simple subscription
      const paymentResponse = await new Promise<any>((resolve, reject) => {
        this.paymentService.createPayment(payload).subscribe({
          next: (res) => resolve(res),
          error: (err) => reject(err)
        });
      });

      if (!paymentResponse?.clientSecret) {
        throw new Error('Failed to init payment');
      }

      // 2. Confirm Card Payment
      const result = await this.stripe.confirmCardPayment(paymentResponse.clientSecret, {
        payment_method: {
          card: this.cardElement,
          billing_details: {
            name: this.cardHolderName || this.currentUser()?.fullName,
            email: this.currentUser()?.email
          },
        },
        return_url: `${window.location.origin}/booking-confirmation/${this.selectedBookingForPayment.id}`
      });

      if (result.error) {
        this.cardErrors = result.error.message || 'Payment failed';
        this.toastr.error(this.cardErrors);
        this.router.navigate(['/booking-cancellation']);
      } else if (result.paymentIntent?.status === 'succeeded') {
        // 3. Notify backend to update booking status to Paid
        try {
          await new Promise<any>((resolve, reject) => {
            this.paymentService.confirmStripePayment(result.paymentIntent!.id).subscribe({
              next: (res) => resolve(res),
              error: (err) => reject(err)
            });
          });
        } catch (confirmErr: any) {
          // ConfirmPayment call failed, but payment succeeded on Stripe
          // Log for debugging but proceed with success
          console.error("Backend ConfirmPayment failed:", confirmErr);
          this.toastr.warning('Payment received. Booking status will update shortly.', 'Processing');
        }

        this.toastr.success('Payment completed successfully!', 'Success');

        // Capture ID before closing modal (which might clear the selection)
        const paidBookingId = this.selectedBookingForPayment?.id;
        const paymentIntentId = result.paymentIntent.id;

        // 4. Refresh list to show Paid status
        this.loadAllBookings();
        this.closePaymentModal();

        // 5. Redirect to receipt
        if (paidBookingId) {
          this.router.navigate(['/booking-confirmation', paidBookingId], {
            queryParams: {
              paymentIntentId: paymentIntentId,
            },
          });
        }
      }

    } catch (error: any) {

      this.cardErrors = error?.error?.message || 'An unexpected error occurred';
      this.router.navigate(['/booking-cancellation']);
    } finally {
      this.isProcessingPayment = false;
    }
  }

  completePayment(booking: BookingDto) {
    this.openPaymentModal(booking);
  }

  cancelBooking(booking: BookingDto) {
    // Keep original business rules while making code clearer
    if (booking.status === 'Cancelled') {
      this.toastr.error('Booking already cancelled');
      return;
    }

    // Only enforce 7-day limit for Users; Admin can cancel anytime
    if (this.role() === 'User') {
      const createdDate = new Date(booking.createdAt || '');
      const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceCreation > 7) {
        this.toastr.error('Cannot cancel booking after 7 days');
        return;
      }
    }

    if (!confirm(this.i18n.t('dashboard.confirmCancel'))) return;

    this.bookings.cancelBooking(String(booking.id)).subscribe({
      next: () => {
        this.toastr.success('Booking cancelled successfully');
        if (this.role() === 'Admin') {
          this.loadAllBookings();
        } else {
          this.loadMyBookings();
        }
      },
      error: (err) => {

        const serverMessage = err?.error?.message || 'Failed to cancel booking';
        this.toastr.error(serverMessage);
      }
    });
  }

  // Delete booking permanently (Admin only)
  deleteBooking(booking: BookingDto) {
    if (this.role() !== 'Admin') {
      this.toastr.error('Only administrators can delete bookings');
      return;
    }

    this.openDeleteConfirm(
      'Delete Booking',
      `Are you sure you want to permanently delete booking #${booking.id}? This action cannot be undone.`,
      'booking',
      booking.id!,
      () => {
        this.bookings.deleteBooking(String(booking.id)).subscribe({
          next: () => {
            this.toastr.success('Booking deleted successfully');
            this.loadAllBookings();
          },
          error: (err) => {
            const serverMessage = err?.error?.message || 'Failed to delete booking';
            this.toastr.error(serverMessage);
          }
        });
      }
    );
  }

  // ----- Users -----
  loadAllUsers() {
    this.usersLoading.set(true);
    this.http.get<{ data: UserDto[] }>(`${environment.apiUrl}/Auth/Users`, { withCredentials: true }).subscribe({
      next: (response) => {
        this.allUsers.set(response.data);
        this.usersLoading.set(false);
      },
      error: (err) => {

        this.toastr.error('Failed to load users');
        this.usersLoading.set(false);
      }
    });
  }

  loadUsersByRole(role: string) {
    this.usersLoading.set(true);
    this.http.get<{ data: UserDto[] }>(`${environment.apiUrl}/Auth/UsersByRole/${role}`, { withCredentials: true }).subscribe({
      next: (response) => {
        this.usersByRole.set(response.data);
        this.usersLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users by role', err);
        this.toastr.error('Failed to load users by role');
        this.usersLoading.set(false);
      }
    });
  }

  openRoleModal(user: UserDto) {
    this.selectedUser.set(user);
    this.roleToAssign.set('User');
    this.showRoleModal.set(true);
  }

  assignRole() {
    const user = this.selectedUser();
    if (!user) return;

    const payload: AssignRoleDto = {
      userId: user.id!,
      roleName: this.roleToAssign()
    };

    this.http.post(`${environment.apiUrl}/Auth/AssignRole`, payload, { withCredentials: true }).subscribe({
      next: () => {
        this.toastr.success('Role assigned successfully');
        this.showRoleModal.set(false);
        this.loadAllUsers();
      },
      error: (err: any) => {
        console.error('Failed to assign role', err);
        this.toastr.error('Failed to assign role');
      }
    });
  }

  removeRole(user: UserDto, role: string) {
    const displayName = user.fullName || `${user.firstName} ${user.lastName}`;
    if (!confirm(`Remove ${role} role from ${displayName}?`)) return;

    const payload: AssignRoleDto = {
      userId: user.id!,
      roleName: role
    };

    this.http.post(`${environment.apiUrl}/Auth/RemoveRole`, payload, { withCredentials: true }).subscribe({
      next: () => {
        this.toastr.success('Role removed successfully');
        this.loadAllUsers();
      },
      error: (err: any) => {
        console.error('Failed to remove role', err);
        this.toastr.error('Failed to remove role');
      }
    });
  }

  // ----- View helpers -----
  setActiveView(view: 'overview' | 'bookings' | 'users' | 'hotels' | 'international-transport' | 'ground-transport') {
    this.activeView.set(view);
    this.searchQuery.set('');

    if (view === 'bookings' && this.role() === 'Admin' && this.allBookings().length === 0) {
      this.loadAllBookings();
    }
    if (view === 'users' && this.allUsers().length === 0) {
      this.loadAllUsers();
    }
    if (view === 'hotels') {
      if (this.role() === 'Admin' && this.allHotels().length === 0) {
        this.loadHotels();
      } else if (this.role() === 'HotelManager' && this.myHotels().length === 0) {
        this.loadHotels();
      }
    }
    if (view === 'international-transport' && this.role() === 'Admin' && this.allInternationalTransports().length === 0) {
      this.loadInternationalTransports();
    }
    if (view === 'ground-transport' && this.role() === 'Admin' && this.allGroundTransports().length === 0) {
      this.loadGroundTransports();
    }
  }

  updateSearchQuery(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  updateUserRoleFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.userRoleFilter.set(value);
  }

  updateBookingStatusFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.bookingStatusFilter.set(value);
  }

  updateRoleToAssign(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.roleToAssign.set(value);
  }

  // ----- Booking helpers -----
  canCancelBooking(booking: BookingDto): boolean {
    if (booking.status === 'Cancelled') return false;
    if (this.role() === 'Admin') return true;
    if (this.role() === 'User') {
      const createdDate = new Date(booking.createdAt || '');
      const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCreation <= 7;
    }
    return false;
  }

  getDaysSinceCreation(booking: BookingDto): number {
    const createdDate = new Date(booking.createdAt || '');
    return Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  formatDate(dateStr?: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  }



  // ----- Auth / header helpers -----
  logout() {
    this.showUserMenu.set(false);
    this.auth.logout().subscribe({
      next: () => {
        this.toastr.success('Logged out successfully');
      },
      error: (err) => {
        console.error('Logout failed:', err);
        this.toastr.error('Logout failed');
      }
    });
  }

  toggleUserMenu() {
    this.showUserMenu.update(v => !v);
  }

  closeUserMenu() {
    this.showUserMenu.set(false);
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    const first = (user.firstName || '').trim();
    const last = (user.lastName || '').trim();
    const a = first ? first.charAt(0) : (user.fullName ? user.fullName.charAt(0) : 'U');
    const b = last ? last.charAt(0) : '';
    return (a + b).toUpperCase();
  }

  getUserName(userId?: number | null): string {
    if (!userId) return 'Unknown User';
    const user = this.allUsers().find(u => u.id === userId);
    return user ? (user.fullName || `${user.firstName} ${user.lastName}`) : `User #${userId}`;
  }

  getBookingNumber(booking: BookingDto): string {
    return booking.bookingNumber ? booking.bookingNumber : `#${booking.id}`;
  }



  currentUserName(): string {
    const user = this.currentUser();
    if (!user) return '';
    return user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  currentUserPhone(): string {
    const user = this.currentUser();
    if (!user) return '';
    return user.phoneNumber || user.phone || '—';
  }

  goToProfile() {
    this.closeUserMenu();
    try {
      this.router.navigate(['/profile']);
    } catch (e) {
      console.warn('Profile route not available');
    }
  }

  // ----- Hotel management -----
  loadHotels() {
    this.hotelsLoading.set(true);
    const url = this.role() === 'HotelManager'
      ? `${environment.apiUrl}/Hotel/GetMyHotels`
      : `${environment.apiUrl}/Hotel/GetAllFiltered`;

    this.http.get<{ data: HotelDto[] }>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        if (this.role() === 'HotelManager') {
          this.myHotels.set(response.data);
        } else {
          this.allHotels.set(response.data);
        }
        this.hotelsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load hotels', err);
        // Don't show toastr error for loading hotels - silent fail
        this.hotelsLoading.set(false);
      }
    });
  }

  openHotelModal(hotel?: HotelDto) {
    this.selectedFile = null;
    this.imagePreviewUrl = null; // Reset preview
    if (hotel) {
      this.hotelFormData = JSON.parse(JSON.stringify(hotel)); // Deep copy
      if (!this.hotelFormData.rooms) this.hotelFormData.rooms = [];
      this.selectedHotel.set(hotel);
    } else {
      this.hotelFormData = {
        name: '',
        address: '',
        city: 'Makkah',
        pricePerNight: 0,
        availableRooms: 0,
        starRating: 3,
        distanceToHaram: 0,
        description: '',
        descriptionAr: '',
        amenities: '',
        rooms: []
      } as HotelDto;
      this.selectedHotel.set(null);
    }
    this.showHotelModal.set(true);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0] ?? null;
    this.selectedFile = file;

    // Generate preview URL for the selected image
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.imagePreviewUrl = null;
    }
  }

  saveHotel() {
    const hotelData = this.hotelFormData as HotelDto;

    // Frontend validation
    if (!hotelData.name?.trim()) {
      this.toastr.error('Hotel name is required');
      return;
    }
    if (!hotelData.address?.trim()) {
      this.toastr.error('Address is required');
      return;
    }
    if (!hotelData.rooms || hotelData.rooms.length === 0) {
      this.toastr.error('Hotel must have at least one room');
      return;
    }
    if (hotelData.rooms && hotelData.rooms.length > 0) {
      for (let i = 0; i < hotelData.rooms.length; i++) {
        const room = hotelData.rooms[i];
        if (!room.roomType) {
          this.toastr.error(`Room ${i + 1}: Type is required`);
          return;
        }
        if (!room.pricePerNight || room.pricePerNight < 1) {
          this.toastr.error(`Room ${i + 1}: Price must be greater than 0`);
          return;
        }
        if (!room.capacity || room.capacity < 1) {
          this.toastr.error(`Room ${i + 1}: Capacity must be at least 1`);
          return;
        }
      }
    }

    const isEdit = !!this.selectedHotel();
    const url = isEdit
      ? `${environment.apiUrl}/Hotel/UpdateHotel/${hotelData.id}`
      : `${environment.apiUrl}/Hotel/CreateHotel`;

    const formData = new FormData();

    formData.append('Name', hotelData.name || '');
    formData.append('City', hotelData.city || 'Makkah');
    formData.append('Address', hotelData.address || '');
    formData.append('StarRating', String(hotelData.starRating || 3));
    formData.append('DistanceToHaram', String(hotelData.distanceToHaram || 0));
    formData.append('Description', hotelData.description || '');
    formData.append('DescriptionAr', hotelData.descriptionAr || '');
    formData.append('IsActive', 'true');

    // Append Rooms (indexed for MVC binding)
    if (hotelData.rooms && hotelData.rooms.length > 0) {
      hotelData.rooms.forEach((room, index) => {
        if (room.id) formData.append(`Rooms[${index}].Id`, room.id.toString());
        formData.append(`Rooms[${index}].RoomType`, room.roomType);
        formData.append(`Rooms[${index}].Capacity`, room.capacity.toString());
        formData.append(`Rooms[${index}].PricePerNight`, room.pricePerNight.toString());
        formData.append(`Rooms[${index}].TotalRooms`, (room.totalRooms ?? 0).toString());
        formData.append(`Rooms[${index}].AvailableRooms`, (room.availableRooms ?? 0).toString());
        formData.append(`Rooms[${index}].IsActive`, (room.isActive ?? true).toString());
      });
    } else {
      // Fallback for creating a default room if none added specifically (legacy support)
      // OR we can force user to add a room. For now, let's keep the manual simple fallback if empty
      // But better to let the UI drive this. Removing the hardcoded default room logic from previous version.
    }

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    } else if (isEdit && hotelData.imageUrl) {
      formData.append('ImageUrl', hotelData.imageUrl);
    }

    const request = isEdit
      ? this.http.put(url, formData, { withCredentials: true })
      : this.http.post(url, formData, { withCredentials: true });

    request.subscribe({
      next: (resp: any) => {
        this.toastr.success(isEdit ? 'Hotel updated successfully' : 'Hotel created successfully');
        this.showHotelModal.set(false);
        this.cacheService.invalidate('hotels');
        this.loadHotels();
      },
      error: (err: any) => {
        console.error('Failed to save hotel', err);
        const serverMessage = err?.error?.message || err?.error?.errors?.join(', ') || err?.message || 'Failed to save hotel';
        this.toastr.error(serverMessage);
      }
    });
  }

  loadRoomTypes() {
    this.http.get<{ data: string[] }>(`${environment.apiUrl}/Enum/RoomTypes`, { withCredentials: true }).subscribe({
      next: (response) => {
        this.roomTypes.set(response.data);
      },
      error: (err) => {
        console.error('Failed to load room types', err);
      }
    });
  }

  addRoom() {
    if (!this.hotelFormData.rooms) {
      this.hotelFormData.rooms = [];
    }
    this.hotelFormData.rooms.push({
      roomType: 'Single',
      hotelId: this.hotelFormData.id!,
      capacity: 2,
      pricePerNight: 0,
      totalRooms: 1,
      availableRooms: 1,
      isActive: true
    });
  }

  removeRoom(index: number) {
    if (this.hotelFormData.rooms) {
      this.hotelFormData.rooms.splice(index, 1);
    }
  }

  viewHotelDetails(hotel: HotelDto) {
    if (!hotel || !hotel.id) return;
    this.router.navigate(['/hotels', hotel.id]);
  }

  getHotelImage(hotel: HotelDto): string {
    if (!hotel.imageUrl) return 'assets/images/hotel-placeholder.jpg';
    if (hotel.imageUrl.startsWith('http')) return hotel.imageUrl;
    return `${environment.apiUrlForImages}${hotel.imageUrl}`;
  }

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/600x400/EEE/31343C?text=No+Image';
  }

  formatForInput(dateStr: string | undefined | null): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  // ----- International transport -----
  loadInternationalTransports() {
    this.internationalTransportsLoading.set(true);
    this.http.get<{ data: InternationalTransportDto[] }>(`${environment.apiUrl}/InternationalTransport/GetAllTransports`, { withCredentials: true }).subscribe({
      next: (response) => {
        this.allInternationalTransports.set(response?.data || []);
        this.internationalTransportsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load international transports', err);
        this.toastr.error('Failed to load international transports');
        this.internationalTransportsLoading.set(false);
      }
    });
  }

  openInternationalTransportModal(transport?: InternationalTransportDto) {
    if (transport) {
      this.internationalTransportFormData = {
        ...transport,
        departureDate: this.formatForInput(transport.departureDate),
        arrivalDate: this.formatForInput(transport.arrivalDate)
      } as InternationalTransportDto;
      this.selectedInternationalTransport.set(transport);
    } else {
      this.internationalTransportFormData = {
        carrierName: '',
        transportType: 'Plane',
        departureAirport: '',
        departureAirportCode: '',
        arrivalAirport: '',
        arrivalAirportCode: '',
        departureDate: '',
        arrivalDate: '',
        price: 0,
        totalSeats: 0,
        availableSeats: 0,
        flightNumber: '',
        isActive: true,
        duration: ''
      } as InternationalTransportDto;
      this.selectedInternationalTransport.set(null);
    }
    this.showInternationalTransportModal.set(true);
  }

  saveInternationalTransport() {
    const transportData = this.internationalTransportFormData;

    // Validation
    if (!transportData.carrierName?.trim()) {
      this.toastr.error('Carrier Name is required');
      return;
    }
    if (!transportData.departureAirport?.trim() || !transportData.arrivalAirport?.trim()) {
      this.toastr.error('Departure and Arrival Airports are required');
      return;
    }
    if (!transportData.price || transportData.price <= 0) {
      this.toastr.error('Price must be greater than 0');
      return;
    }
    if (!transportData.departureDate || !transportData.arrivalDate) {
      this.toastr.error('Dates are required');
      return;
    }

    const isEdit = !!this.selectedInternationalTransport();
    const url = isEdit
      ? `${environment.apiUrl}/InternationalTransport/UpdateTransport/${transportData.id}`
      : `${environment.apiUrl}/InternationalTransport/CreateTransport`;

    const request = isEdit
      ? this.http.put(url, transportData, { withCredentials: true })
      : this.http.post(url, transportData, { withCredentials: true });

    request.subscribe({
      next: () => {
        this.toastr.success(isEdit ? 'Transport updated successfully' : 'Transport created successfully');
        this.showInternationalTransportModal.set(false);
        this.loadInternationalTransports();
      },
      error: (err: any) => {
        this.toastr.error('Failed to save transport');
      }
    });
  }

  deleteInternationalTransport(id: number) {
    this.openDeleteConfirm(
      'Delete Transport',
      'Are you sure you want to delete this international transport? This action cannot be undone.',
      'internationalTransport',
      id,
      () => {
        this.http.delete(`${environment.apiUrl}/InternationalTransport/DeleteTransport/${id}`, { withCredentials: true }).subscribe({
          next: () => {
            this.toastr.success('Transport deleted successfully');
            this.loadInternationalTransports();
          },
          error: (err) => {
            console.error('Failed to delete transport', err);
            this.toastr.error('Failed to delete transport');
          }
        });
      }
    );
  }

  // ----- Ground transport -----
  loadGroundTransports() {
    this.groundTransportsLoading.set(true);
    this.http.get<{ data: GroundTransportDto[] }>(`${environment.apiUrl}/GroundTransport/GetAllGroundTransports`, { withCredentials: true }).subscribe({
      next: (response) => {
        this.allGroundTransports.set(response?.data || []);
        this.groundTransportsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load ground transports', err);
        this.toastr.error('Failed to load ground transports');
        this.groundTransportsLoading.set(false);
      }
    });
  }

  openGroundTransportModal(transport?: GroundTransportDto) {
    if (transport) {
      this.groundTransportFormData = { ...transport } as GroundTransportDto;
      this.selectedGroundTransport.set(transport);
    } else {
      this.groundTransportFormData = {
        serviceName: '',
        serviceNameAr: '',
        type: 'PrivateCar',
        pricePerPerson: 0,
        description: '',
        descriptionAr: '',
        capacity: 0,
        isActive: true,
        route: '',
        duration: ''
      } as GroundTransportDto;
      this.selectedGroundTransport.set(null);
    }
    this.showGroundTransportModal.set(true);
  }

  saveGroundTransport() {
    const transportData = this.groundTransportFormData;

    // Validation - validate both destinationFrom (route) and destinationTo (duration)
    if (!transportData.route?.trim()) {
      this.toastr.error('Destination From is required');
      return;
    }
    if (!transportData.duration?.trim()) {
      this.toastr.error('Destination To is required');
      return;
    }
    if (!transportData.pricePerPerson || transportData.pricePerPerson <= 0) {
      this.toastr.error('Price must be greater than 0');
      return;
    }

    // Auto-generate serviceName from route (From) and duration (To) for backend
    transportData.serviceName = `${transportData.type}: ${transportData.route} → ${transportData.duration}`;

    const isEdit = !!this.selectedGroundTransport();
    const url = isEdit
      ? `${environment.apiUrl}/GroundTransport/UpdateGroundTransport/${transportData.id}`
      : `${environment.apiUrl}/GroundTransport/CreateGroundTransport`;

    const request = isEdit
      ? this.http.put(url, transportData, { withCredentials: true })
      : this.http.post(url, transportData, { withCredentials: true });

    request.subscribe({
      next: () => {
        this.toastr.success(isEdit ? 'Transport updated successfully' : 'Transport created successfully');
        this.showGroundTransportModal.set(false);
        this.loadGroundTransports();
      },
      error: (err: any) => {
        this.toastr.error('Failed to save transport');
      }
    });
  }

  deleteGroundTransport(id: number) {
    this.openDeleteConfirm(
      'Delete Ground Transport',
      'Are you sure you want to delete this ground transport? This action cannot be undone.',
      'groundTransport',
      id,
      () => {
        this.http.delete(`${environment.apiUrl}/GroundTransport/DeleteGroundTransport/${id}`, { withCredentials: true }).subscribe({
          next: () => {
            this.toastr.success('Transport deleted successfully');
            this.loadGroundTransports();
          },
          error: (err) => {
            console.error('Failed to delete transport', err);
            this.toastr.error('Failed to delete transport');
          }
        });
      }
    );
  }

  getTransportTypeName(type: string | number, isInternational: boolean): string {
    if (isInternational) {
      return String(type);
    } else {
      // Handle both string (backend) and legacy number cases
      if (type === 'PrivateCar' || type === 0) return 'Private Car';
      if (type === 'SharedBus' || type === 1) return 'Shared Bus';
      if (type === 'Taxi' || type === 2) return 'Taxi';
      if (type == 'Train' || type === 3) return 'Train';
      return String(type);
    }
  }

  // ----- UI labels / i18n -----
  getBookingViewTitle(): string {
    return this.role() === 'Admin' ? this.i18n.t('dashboard.menu.dashboard') : this.i18n.t('dashboard.menu.myBookings');
  }

  getWelcomeMessage(): string {
    const role = this.role();
    if (role === 'Admin') return this.i18n.t('dashboard.welcome.admin');
    if (role === 'HotelManager') return this.i18n.t('dashboard.welcome.hotelManager');
    return this.i18n.t('dashboard.welcome.user');
  }

  getBookingsMenuLabel(): string {
    return this.role() === 'Admin' ? this.i18n.t('dashboard.menu.dashboard') : this.i18n.t('dashboard.menu.myBookings');
  }





}
