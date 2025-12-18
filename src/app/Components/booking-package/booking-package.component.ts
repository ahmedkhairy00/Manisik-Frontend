import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HotelsService } from '../../core/services/hotels.service';
import { Hotel } from './../../interfaces/hotel.interface';
import {
  PaymentProvider,
  CreatePaymentRequest,
} from './../../interfaces/payment.interface';
import { PaymentService } from '../../core/services/payment.service';
import { NotificationService } from '../../core/services/notification.service';
import { environment } from '../../../environments/environment';
import {
  loadStripe,
  Stripe,
  StripeCardElement,
  StripeElements,
} from '@stripe/stripe-js';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { BookingsService } from '../../core/services/bookings.service';
import { CreateBookingRequest, TripType } from '../../interfaces/booking.interface';
import { UploadService } from '../../core/services/upload.service';

type BookingSnapshot = {
  makkahHotel: any;
  madinahHotel: any;
  internationalTransport: any;
  groundTransport: any;
  type?: string;
  tripType?: string;
};

// ... existing code ...

import { I18nService } from '../../core/services/i18n.service';
import { CountriesService, Country } from '../../core/services/countries.service';
import { validateImageFile, convertImageToWebP } from '../../shared/utils/image.utils';

import {
  LucideAngularModule,
  Check,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  Building2,
  MapPin,
  Star,
  Navigation,
  Bed,
  Mail,
  FileText,
  ChevronDown,
  AlertCircle,
  User,
  Flag,
  Globe,
  CreditCard,
  Plane,
  Bus,
  Building,
  RefreshCw,
  Trash2,
  Camera
} from 'lucide-angular';

@Component({
  selector: 'app-booking-package',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  providers: [],
  templateUrl: './booking-package.component.html',
  styleUrls: ['./booking-package.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingPackageComponent implements OnInit, OnDestroy {
  @ViewChild('cardElement')
  set cardElementRef(value: ElementRef<HTMLDivElement> | undefined) {
    this.cardElementHost = value;
    if (value && this.clientSecret) {
      this.mountStripeCard();
    }
  }

  readonly stripeConfig = environment.stripe;

  hotels: Hotel[] = [];
  selectedTripType: 'umrah' | 'hajj' = 'umrah';

  hotelBookedMessage = '';
  transportBookedMessage = '';
  groundBookedMessage = '';

  bookingId = 0;
  totalAmount = 0;


  // Country & Phone
  countries: Country[] = [];
  countrySearch: string = '';
  selectedPhoneCountry: Country | null = null;

  /**
   * Get filtered countries list based on search input
   */
  get filteredCountries(): Country[] {
    if (!this.countrySearch || this.countrySearch.trim() === '') {
      return this.countries;
    }
    const search = this.countrySearch.toLowerCase().trim();
    return this.countries.filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.nameAr.includes(search) ||
      c.code.toLowerCase().includes(search)
    );
  }

  // Data Cache
  bookingSnapshot: BookingSnapshot | null = null;

  passenger: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    passport: string;
    passportExpiry: string;
    passportIssuingCountry: string;
    nationality: string;
    gender: number;
    photoPreview: string | null;
    photoUrl: string | null;
  } = {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      passport: '',
      passportExpiry: '',
      passportIssuingCountry: '',
      nationality: '',
      gender: 0, // 0 = Male, 1 = Female
      photoPreview: null,
      photoUrl: null,
    };

  // File to be uploaded
  selectedPhotoFile: File | null = null;

  paymentMethod: 'stripe' | 'cash' = 'stripe';

  clientSecret: string | null = null;
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  cardElement?: StripeCardElement;
  private cardElementHost?: ElementRef<HTMLDivElement>;

  isFinalizing = false;
  isPaymentProcessing = false;
  paymentError = '';
  paymentSuccess = '';

  // Document requirements visibility
  showDocumentRequirements = true;
  private savePassengerSubject = new Subject<void>();

  constructor(
    private hotelApi: HotelsService,
    private router: Router,
    private paymentService: PaymentService,
    private bookingsService: BookingsService,
    private notificationService: NotificationService,
    private auth: AuthService,
    public i18nService: I18nService,
    private countriesService: CountriesService,
    private uploadService: UploadService,
    private cdr: ChangeDetectorRef
  ) {
    // Register icons (if using a version that requires manual registry, otherwise the module import is enough for standalone if icons are provided in providers or imports)
    // For lucide-angular 0.553.0 with standalone components, we usually import the icons directly in the imports array or use a provider.
    // Let's check how it was done in other components or just add them to the imports array which is the standard way for standalone.

    // Initialize countries
    this.countries = this.countriesService.getCountries();
    // Add "None" option as requested
    this.countries.unshift({
      name: 'None',
      nameAr: 'لا يوجد',
      code: 'NONE',
      dialCode: '',
      flag: '🏳️'
    });

    // Default to Egypt if available, otherwise just leave null
    const eg = this.countriesService.getCountryByCode('EG');
    this.selectedPhoneCountry = eg || null;
  }

  ngOnInit() {
    this.savePassengerSubject.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.performSavePassengerData();
    });

    this.loadHotels();

    // Load initial snapshot
    this.bookingSnapshot = this.getBookingSnapshotFromStorage();

    // CRITICAL FIX: storage depends on user ID, so we must wait for auth check
    this.auth.currentUser$.subscribe(user => {
      // Only run initialization logic once we have a definitive user state (null or Object)
      // Note: currentUser$ starts as null, so we might want to skip the very first emission if it's default value
      // But auth service checkAuth() emits quickly. 

      this.ensureBookingId();
      this.loadPassengerData();
      this.checkBookingStatus();

      // If local draft is missing or partial, try load pending pieces from server
      this.loadPendingFromServerIfMissing().then(() => {
        // Refresh cache after potential server load
        this.bookingSnapshot = this.getBookingSnapshotFromStorage();
        this.cdr.markForCheck();
      });
    });
  }

  ngOnDestroy(): void {
    this.cleanupStripe();
  }

  // ---------------- Hotel & Transport Status ----------------
  private loadHotels() {
    this.hotelApi.getHotels().subscribe({
      next: (data) => {
        this.hotels = data;
        this.cdr.markForCheck();
      },
      error: (err) => { },
    });
  }

  private async loadPendingFromServerIfMissing() {
    try {
      // ALWAYS fetch from server to ensure sync across devices/sessions
      const [hotels, grounds, internationals] = await Promise.all([
        firstValueFrom(this.bookingsService.getMyPendingHotelBookings()),
        firstValueFrom(this.bookingsService.getMyPendingGroundBookings()),
        firstValueFrom(this.bookingsService.getMyPendingTransportBookings())
      ]);

      // Initialize draft with CURRENT local data to prevent overwriting with empty object
      const currentLocal = this.auth.getBookingData() || {};
      const draft: any = { ...currentLocal };

      let hasServerData = false;
      let serverBookingId: number | null = null;

      // Map server hotel results - check for BOTH Makkah and Madinah
      if (hotels && hotels.length) {
        for (const hotel of hotels) {
          // Extract server's bookingId
          if (!serverBookingId && hotel.bookingId) {
            serverBookingId = hotel.bookingId;
          }

          const city = (hotel.city || '').toLowerCase();
          if (city === 'makkah' || city === 'مكة') {
            draft.makkahHotelData = {
              hotelId: hotel.hotelId,
              roomId: hotel.roomId,
              hotelName: hotel.hotelName,
              roomType: hotel.roomType,
              checkInDate: hotel.checkInDate,
              checkOutDate: hotel.checkOutDate,
              numberOfRooms: hotel.numberOfRooms,
              totalPrice: hotel.totalPrice,
              bookingHotelId: hotel.bookingHotelId,
              bookingId: hotel.bookingId
            };
            hasServerData = true;
          } else if (city === 'madinah' || city === 'المدينة') {
            draft.madinahHotelData = {
              hotelId: hotel.hotelId,
              roomId: hotel.roomId,
              hotelName: hotel.hotelName,
              roomType: hotel.roomType,
              checkInDate: hotel.checkInDate,
              checkOutDate: hotel.checkOutDate,
              numberOfRooms: hotel.numberOfRooms,
              totalPrice: hotel.totalPrice,
              bookingHotelId: hotel.bookingHotelId,
              bookingId: hotel.bookingId
            };
            hasServerData = true;
          }
        }
      }

      // Map server ground transport results
      if (grounds && grounds.length) {
        const ground = grounds[grounds.length - 1];
        if (!serverBookingId && ground.bookingId) {
          serverBookingId = ground.bookingId;
        }
        draft.groundData = {
          groundTransportId: ground.groundTransportId,
          serviceName: ground.serviceName,
          serviceDate: ground.serviceDate,
          pickupLocation: ground.pickupLocation,
          dropoffLocation: ground.dropoffLocation,
          numberOfPassengers: ground.numberOfPassengers,
          totalPrice: ground.totalPrice,
          bookingGroundTransportId: ground.bookingGroundTransportId,
          bookingId: ground.bookingId
        };
        hasServerData = true;
      }

      // Map server international transport results
      if (internationals && internationals.length) {
        const transport = internationals[internationals.length - 1];
        if (!serverBookingId && transport.bookingId) {
          serverBookingId = transport.bookingId;
        }
        draft.transportData = {
          transportId: transport.internationalTransportId || transport.transportId,
          carrierName: transport.carrierName,
          transportType: transport.transportType,
          numberOfSeats: transport.numberOfSeats,
          totalPrice: transport.totalPrice,
          bookingInternationalTransportId: transport.bookingInternationalTransportId,
          bookingId: transport.bookingId
        };
        hasServerData = true;
      }

      // Save to local storage for fast access
      if (hasServerData) {
        // Store server's bookingId as the source of truth
        if (serverBookingId) {
          draft.bookingId = serverBookingId;
          this.bookingId = serverBookingId;
        }
        this.auth.saveBookingData(draft);

      } else {
        // Server has no pending data - DO NOT Clear local storage blindly as it might be ahead of server (race condition)

        // this.auth.clearUserBookingData(); // DISABLED to fix data loss bug
        if (draft.bookingId) {
          this.bookingId = draft.bookingId;
        }
      }

      // Re-evaluate status
      this.checkBookingStatus();
      this.cdr.markForCheck();
    } catch (err) {
      // non-fatal
      // Error handled silently or via alternative logging if needed
    }
  }

  private checkBookingStatus() {
    const snapshot = this.getBookingSnapshotFromStorage();

    // Hotel status messages
    const makkahBooked = !!snapshot.makkahHotel;
    const madinahBooked = !!snapshot.madinahHotel;

    this.hotelBookedMessage =
      makkahBooked && madinahBooked
        ? '✔ تم حجز الفنادق (مكة والمدينة) بنجاح'
        : makkahBooked
          ? '✔ تم حجز فندق مكة بنجاح'
          : madinahBooked
            ? '✔ تم حجز فندق المدينة بنجاح'
            : '';

    // Transport status messages
    this.transportBookedMessage = snapshot.internationalTransport
      ? '✔ تم حجز الطيران/البحري بنجاح'
      : '';
    this.groundBookedMessage = snapshot.groundTransport ? '✔ تم حجز النقل البري بنجاح' : '';

    // Calculate total
    if (
      snapshot.makkahHotel &&
      snapshot.madinahHotel &&
      snapshot.internationalTransport &&
      snapshot.groundTransport
    ) {
      this.totalAmount = this.calculateTotalAmount(snapshot);
    }
  }

  /**
   * Reset all booking status for a fresh booking after completing a main booking
   */
  /**
   * Reset all booking status for a fresh booking after completing a main booking
   */
  private resetBookingStatus() {
    this.hotelBookedMessage = '';
    this.transportBookedMessage = '';
    this.groundBookedMessage = '';
    this.totalAmount = 0;
    this.bookingId = 0;

    // Reset passenger form to defaults
    this.passenger = {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      passport: '',
      passportExpiry: '',
      passportIssuingCountry: '',
      nationality: '',
      gender: 0,
      photoPreview: null,
      photoUrl: null,
    };
    this.selectedPhotoFile = null;


  }

  /**
   * Public manual reset for user "Start Fresh"
   */
  async resetBooking() {
    const confirm = window.confirm(this.i18nService.t('Are you sure you want to clear all booking data and start fresh?'));
    if (!confirm) return;

    this.auth.clearUserBookingData();
    this.resetBookingStatus();

    // Generate new ID immediately
    this.ensureBookingId();

    this.notificationService.info('Booking form has been reset.', 'Cleared');

    // Force reload to ensure no lingering state provided by services
    // window.location.reload(); 
    // OR just re-init checks
    this.checkBookingStatus();
    this.cdr.markForCheck();
  }

  // ---------------- Booking Actions ----------------
  chooseTrip(type: 'umrah' | 'hajj') {
    this.selectedTripType = type;
  }

  goToHotelsPage(city?: 'Makkah' | 'Madinah') {
    this.router.navigate(['/hotels'], { queryParams: city ? { city } : {} });
  }

  goToTransportPage(tab: 'international' | 'ground' = 'international') {
    this.router.navigate(['/transport'], { queryParams: { tab } });
  }

  // ---------------- Stripe Payment ----------------
  async finalizeBooking() {
    const snapshot = this.getBookingSnapshot();
    if (!snapshot) return;
    if (!this.isPassengerInfoValid()) return;

    this.totalAmount = this.calculateTotalAmount(snapshot);
    if (this.totalAmount <= 0) {
      this.notificationService.error('لا يمكن المتابعة بدون إجمالي تكلفة صالح.', 'خطأ');
      return;
    }

    // Validate Passport Expiry (Must be > 6 months from travel start)
    const travelStartDate = new Date(snapshot.makkahHotel?.checkInDate || new Date());
    const sixMonthsFromTravel = new Date(travelStartDate);
    sixMonthsFromTravel.setMonth(sixMonthsFromTravel.getMonth() + 6);

    if (this.passenger.passportExpiry) {
      const passportExpiry = new Date(this.passenger.passportExpiry);
      if (passportExpiry < sixMonthsFromTravel) {
        this.notificationService.error('Passport expiry date must be more than 6 months from the travel date.', 'Error');
        return;
      }
    }

    this.isFinalizing = true;
    this.cdr.markForCheck();

    try {
      // Create booking and get id
      const savedBookingId = await this.saveBooking(snapshot);



      if (!savedBookingId) {
        throw new Error('No booking ID returned from server');
      }

      this.bookingId = Number(savedBookingId);

      // If stripe, initiate payment UI
      if (this.paymentMethod === 'stripe') {
        await this.initStripePayment();
        // Do not navigate — user should finish payment on this page
      } else {
        // Non-card: navigate to confirmation
        await this.router.navigate(['/booking-confirmation', savedBookingId]);
      }

      this.isFinalizing = false;
      this.cdr.markForCheck();
    } catch (err: any) {
      // If the error was already handled/toasted in saveBooking, we might not need to toast again
      // unless we want to be sure.
      // But let's assume saveBooking throws the error object.

      console.error('Finalize Booking Error:', err);
      this.notificationService.error(err, 'Booking Error');
      this.isFinalizing = false;
      this.cdr.markForCheck();
    }
  }

  private async saveBooking(snapshot: BookingSnapshot): Promise<number | string> {
    const makkahCheckIn = snapshot.makkahHotel?.checkInDate;
    const madinahCheckOut = snapshot.madinahHotel?.checkOutDate;

    // ✅ Clean payload - only send what backend needs for CREATE
    const tripTypeStr = (snapshot.type || snapshot.tripType || this.selectedTripType || 'Umrah').toString().toLowerCase();

    const payload: CreateBookingRequest = {
      type: tripTypeStr === 'hajj' ? TripType.Hajj : TripType.Umrah,
      status: 'Pending',
      travelStartDate: makkahCheckIn || new Date().toISOString(),
      travelEndDate: madinahCheckOut || new Date().toISOString(),
      numberOfTravelers: 1,

      // ✅ Only send essential hotel data (not bookingId or bookingHotelId)
      makkahHotel: {
        hotelId: snapshot.makkahHotel?.hotelId,
        roomId: snapshot.makkahHotel?.roomId,
        City: 'Makkah', // ✅ Required by backend HotelBookingDto
        checkInDate: snapshot.makkahHotel?.checkInDate,
        checkOutDate: snapshot.makkahHotel?.checkOutDate,
        numberOfRooms: snapshot.makkahHotel?.numberOfRooms || 1,
        totalPrice: snapshot.makkahHotel?.totalPrice,
        Status: 'Pending',
      },

      madinahHotel: {
        hotelId: snapshot.madinahHotel?.hotelId,
        roomId: snapshot.madinahHotel?.roomId,
        City: 'Madinah', // ✅ Required by backend HotelBookingDto
        checkInDate: snapshot.madinahHotel?.checkInDate,
        checkOutDate: snapshot.madinahHotel?.checkOutDate,
        numberOfRooms: snapshot.madinahHotel?.numberOfRooms || 1,
        totalPrice: snapshot.madinahHotel?.totalPrice,
        Status: 'Pending',
      },

      // ✅ Only send transportId and numberOfSeats
      internationalTransport: {
        transportId: snapshot.internationalTransport?.transportId,
        numberOfSeats: snapshot.internationalTransport?.numberOfSeats,
        totalPrice: snapshot.internationalTransport?.totalPrice,
        Status: 'Pending',
      },

      // ✅ Send all required ground transport fields
      groundTransport: {
        groundTransportId: snapshot.groundTransport?.groundTransportId,
        serviceDate: snapshot.groundTransport?.serviceDate || new Date().toISOString(),
        pickupLocation: snapshot.groundTransport?.pickupLocation,
        dropoffLocation: snapshot.groundTransport?.dropoffLocation,
        numberOfPassengers: snapshot.groundTransport?.numberOfPassengers || 1,
        totalPrice: snapshot.groundTransport?.totalPrice,
        Status: 'Pending',
      },

      travelers: [
        {
          firstName: this.passenger.firstName,
          lastName: this.passenger.lastName,
          dateOfBirth: this.passenger.dateOfBirth,
          passportNumber: this.passenger.passport,
          passportExpiryDate: this.passenger.passportExpiry,
          passportIssuingCountry: this.passenger.passportIssuingCountry,
          nationality: this.passenger.nationality,
          gender: this.passenger.gender,
          phoneNumber: `${this.selectedPhoneCountry?.dialCode || ''}${this.passenger.phone}`,
          email: this.passenger.email,
          isMainTraveler: true,
          photoUrl: this.passenger.photoUrl, // ✅ Send photo URL to backend
        },
      ],

      totalPrice: this.totalAmount,
    };

    // Payload ready for submission

    try {
      const response = await firstValueFrom(this.bookingsService.createBooking(payload));
      // Booking created successfully

      this.notificationService.success('تم إنشاء الحجز بنجاح!', 'نجاح');

      // Extract ID
      const bookingId = (response as any).data?.id || (response as any).data?.bookingId || (response as any).id;

      if (!bookingId) {
        throw new Error('Booking ID not found in response');
      }

      // Booking saved, proceeding to payment
      // Data will be cleared after successful payment in confirmStripePayment

      return bookingId;
    } catch (error: any) {


      let errorMsg = 'فشل إنشاء الحجز';
      if (typeof error?.error === 'string') {
        errorMsg = error.error; // Backend returned raw string
      } else if (error?.error?.message) {
        errorMsg = error.error.message;
      } else if (error?.error?.title) {
        errorMsg = error.error.title;
      } else if (error?.message) {
        errorMsg = error.message;
      }

      // Check for specific error about pending/existing booking
      if (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('pending')) {
        this.notificationService.warning('Please complete payment for your pending booking in the dashboard', 'Pending Booking');
      } else {
        this.notificationService.error(errorMsg);
      }
      throw error;
    }
  }


  private async initStripePayment() {
    this.paymentError = '';

    try {
      const payload: CreatePaymentRequest = {
        bookingId: this.bookingId,
        amount: this.totalAmount || 0,
        currency: (this.stripeConfig?.currency || 'usd').toLowerCase(),
        idempotencyKey: `booking-${this.bookingId}-${Date.now()}`,
      };

      const response = await firstValueFrom(this.paymentService.createPayment(payload));

      if (!response.clientSecret) {
        throw new Error('لم نستلم client secret من Stripe.');
      }

      this.clientSecret = response.clientSecret;
      this.mountStripeCard();

      this.notificationService.info('برجاء إدخال بيانات البطاقة لإتمام الدفع.', 'Stripe');
      this.cdr.markForCheck();
    } catch (error: any) {


      if (error.status === 404) {
        this.notificationService.error('نقطة نهاية الدفع غير موجودة. يرجى الاتصال بالدعم.');
      } else {
        const errorMsg = error?.error?.message || 'فشل تهيئة الدفع. الرجاء المحاولة مرة أخرى.';
        this.notificationService.error(errorMsg);
      }
      throw error;
    } finally {
      this.isFinalizing = false;
    }
  }

  async confirmStripePayment() {
    if (!this.stripe || !this.cardElement || !this.clientSecret) return;

    this.isPaymentProcessing = true;
    this.paymentError = '';

    const billingName = `${this.passenger.firstName} ${this.passenger.lastName}`.trim();

    try {
      const result = await this.stripe.confirmCardPayment(this.clientSecret, {
        payment_method: {
          card: this.cardElement,
          billing_details: {
            name: billingName || undefined,
            email: this.passenger.email || undefined,
            phone: this.passenger.phone || undefined,
          },
        },
        return_url: `${window.location.origin}/booking-confirmation/${this.bookingId}`
      });

      if (result.error) {
        this.paymentError = result.error.message || 'فشل الدفع.';
        this.notificationService.error(this.paymentError);
        this.router.navigate(['/booking-cancellation']);
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        // IMPORTANT: Call backend to confirm payment and update booking status
        // This ensures the booking is marked as Confirmed before we clear localStorage
        try {
          // Use Angular HttpClient (via PaymentService) to ensure Auth Token is attached
          await firstValueFrom(this.paymentService.confirmStripePayment(result.paymentIntent.id));
          // Payment confirmed on backend successfully
        } catch (confirmErr: any) {
          const errorMsg = confirmErr?.error?.message || confirmErr?.message || 'Payment confirmation failed on backend.';
          this.notificationService.error(`Warning: Payment successful but verification failed: ${errorMsg}. Please contact support.`);
        }

        this.paymentSuccess = 'تم الدفع بنجاح!';
        this.notificationService.success(this.paymentSuccess, 'Stripe');

        // Save ID before reset
        const completedBookingId = this.bookingId;

        // Clear all booking data from localStorage (server has confirmed status now)
        this.auth.clearUserBookingData();

        // Reset component status for fresh booking
        this.resetBookingStatus();

        // Navigate to confirmation with booking id and payment intent
        this.router.navigate(['/booking-confirmation', completedBookingId], {
          queryParams: {
            paymentIntentId: result.paymentIntent.id,
          },
        });
      }
    } catch (err) {

      this.paymentError = err instanceof Error ? err.message : 'حدث خطأ أثناء الدفع.';
      this.notificationService.error(this.paymentError);
      this.router.navigate(['/booking-cancellation']);
    } finally {
      this.isPaymentProcessing = false;
    }
  }

  /**
   * Cancel payment and close the payment modal
   */
  cancelPayment() {
    this.clientSecret = null;
    this.paymentError = '';
    this.paymentSuccess = '';
    this.cleanupStripe();
    this.notificationService.info('Payment cancelled', 'Info');
    this.cdr.markForCheck();
  }

  // ---------------- Utilities ----------------
  private ensureBookingId() {
    const userData = this.auth.getBookingData();

    // Use server's bookingId if available (set when booking items are created)
    if (userData?.bookingId && typeof userData.bookingId === 'number') {
      this.bookingId = userData.bookingId;
    } else {
      // No booking ID yet - will be set when first booking item is created on server
      this.bookingId = 0;
    }
  }

  private getBookingSnapshotFromStorage(): BookingSnapshot {
    const userData = this.auth.getBookingData() || {};
    return {
      makkahHotel: userData.makkahHotelData || null,
      madinahHotel: userData.madinahHotelData || null,
      internationalTransport: userData.transportData || null,
      groundTransport: userData.groundData || null,
    };
  }

  private getBookingSnapshot(): BookingSnapshot | null {
    const snapshot = this.getBookingSnapshotFromStorage();

    if (!snapshot.makkahHotel || !snapshot.madinahHotel) {
      this.notificationService.warning('يجب حجز فندق في مكة وآخر في المدينة قبل المتابعة.', 'الفنادق مطلوبة');
      return null;
    }

    if (!snapshot.internationalTransport || !snapshot.groundTransport) {
      this.notificationService.warning('يجب إكمال حجز النقل الدولي والنقل البري.', 'النقل مطلوب');
      return null;
    }

    return snapshot;
  }

  private calculateTotalAmount(data: BookingSnapshot): number {
    const hotelTotals =
      this.coerceAmount(data.makkahHotel?.totalPrice) + this.coerceAmount(data.madinahHotel?.totalPrice);
    const transportTotals =
      this.coerceAmount(data.internationalTransport?.totalPrice) + this.coerceAmount(data.groundTransport?.totalPrice);
    const subtotal = hotelTotals + transportTotals;
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% tax
    const serviceFee = 25; // Flat service fee
    return Math.round((subtotal + tax + serviceFee) * 100) / 100;
  }

  private coerceAmount(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  // Price breakdown helpers for Stripe modal
  getSubtotal(): number {
    const snapshot = this.bookingSnapshot || this.getBookingSnapshotFromStorage();
    const makkah = this.coerceAmount(snapshot.makkahHotel?.totalPrice);
    const madinah = this.coerceAmount(snapshot.madinahHotel?.totalPrice);
    const transport = this.coerceAmount(snapshot.internationalTransport?.totalPrice);
    const ground = this.coerceAmount(snapshot.groundTransport?.totalPrice);
    return makkah + madinah + transport + ground;
  }

  getTax(): number {
    // 5% tax
    return Math.round(this.getSubtotal() * 0.05 * 100) / 100;
  }

  getServiceFee(): number {
    // Flat $25 service fee
    return 25;
  }

  // Individual price getters for HTML template
  get makkahHotelData() {
    return this.bookingSnapshot?.makkahHotel;
  }
  get madinahHotelData() {
    return this.bookingSnapshot?.madinahHotel;
  }
  get transportData() {
    return this.bookingSnapshot?.internationalTransport;
  }
  get groundData() {
    return this.bookingSnapshot?.groundTransport;
  }

  private loadPassengerData() {
    const userData = this.auth.getBookingData();
    if (userData?.passengerData) {
      this.passenger = userData.passengerData;
    }
  }

  savePassengerData() {
    this.savePassengerSubject.next();
  }

  private performSavePassengerData() {
    const current = this.auth.getBookingData() || {};
    this.auth.saveBookingData({
      ...current,
      passengerData: this.passenger,
    });
  }

  private async ensureStripeInstance() {
    if (this.stripe) return;
    if (!this.stripeConfig?.publishableKey) {
      throw new Error('Stripe publishable key is missing.');
    }
    this.stripe = await loadStripe(this.stripeConfig.publishableKey);
    if (!this.stripe) throw new Error('تعذر تحميل Stripe.');
  }

  private async mountStripeCard() {
    if (!this.cardElementHost) return;

    await this.ensureStripeInstance();
    if (!this.stripe) return;

    if (this.cardElement) this.cardElement.destroy();

    this.elements = this.stripe.elements();

    // Get current theme colors from CSS variables
    const computedStyle = getComputedStyle(document.documentElement);
    const textColor = computedStyle.getPropertyValue('--color-text').trim() || '#32325d';
    const placeholderColor = computedStyle.getPropertyValue('--color-text-muted').trim() || '#aab7c4';

    this.cardElement = this.elements.create('card', {
      hidePostalCode: true,
      style: {
        base: {
          color: textColor,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '16px',
          fontSmoothing: 'antialiased',
          '::placeholder': {
            color: placeholderColor
          }
        },
        invalid: {
          color: '#ef4444', // red-500
          iconColor: '#ef4444'
        }
      }
    });
    this.cardElement.mount(this.cardElementHost.nativeElement);
  }

  private cleanupStripe() {
    this.cardElement?.destroy();
    this.cardElement = undefined;
    this.elements = null;
    this.stripe = null;
  }

  private clearBookingCache() {
    this.auth.clearUserBookingData();
  }

  private isPassengerInfoValid(): boolean {
    const p = this.passenger;

    // First Name validation
    if (!p.firstName?.trim()) {
      this.notificationService.warning('Please enter your first name', 'Missing Data');
      return false;
    }

    // Last Name validation
    if (!p.lastName?.trim()) {
      this.notificationService.warning('Please enter your last name', 'Missing Data');
      return false;
    }

    // Date of Birth validation
    if (!p.dateOfBirth) {
      this.notificationService.warning('Please enter your date of birth', 'Missing Data');
      return false;
    }
    if (!this.isAgeValid(p.dateOfBirth)) {
      this.notificationService.warning('Traveler must be at least 18 years old', 'Invalid Age');
      return false;
    }

    // Email validation with format check
    if (!p.email?.trim()) {
      this.notificationService.warning('Please enter your email address', 'Missing Data');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(p.email)) {
      this.notificationService.warning('Please enter a valid email address', 'Invalid Email');
      return false;
    }

    // Phone validation
    if (!p.phone?.trim()) {
      this.notificationService.warning('Please enter your phone number', 'Missing Data');
      return false;
    }
    const phoneRegex = /^[0-9]{7,15}$/;
    if (!phoneRegex.test(p.phone.replace(/\s/g, ''))) {
      this.notificationService.warning('Please enter a valid phone number (7-15 digits)', 'Invalid Phone');
      return false;
    }

    // Nationality validation
    if (!p.nationality || p.nationality === 'None') {
      this.notificationService.warning('Please select your nationality', 'Missing Data');
      return false;
    }

    // Passport number validation with format check
    if (!p.passport?.trim()) {
      this.notificationService.warning('Please enter your passport number', 'Missing Data');
      return false;
    }
    const passportRegex = /^[A-Z0-9]{6,9}$/i;
    if (!passportRegex.test(p.passport)) {
      this.notificationService.warning('Passport number must be 6-9 alphanumeric characters', 'Invalid Passport');
      return false;
    }

    // Passport expiry validation
    if (!p.passportExpiry) {
      this.notificationService.warning('Please enter passport expiry date', 'Missing Data');
      return false;
    }
    if (!this.isPassportExpiryValid(p.passportExpiry)) {
      this.notificationService.warning('Passport must confirm to be valid for at least 6 months beyond travel date', 'Invalid Passport Expiry');
      return false;
    }

    // Passport issuing country validation
    if (!p.passportIssuingCountry || p.passportIssuingCountry === 'None') {
      this.notificationService.warning('Please select passport issuing country', 'Missing Data');
      return false;
    }

    return true;
  }

  isAgeValid(dob: string): boolean {
    if (!dob) return false;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  }

  isPassportExpiryValid(expiry: string): boolean {
    if (!expiry) return false;

    // Calculate travel start date (either Makkah check-in or today if not selected yet)
    let travelStartDate = new Date();
    // Use cached snapshot if available
    const snapshot = this.bookingSnapshot || this.getBookingSnapshotFromStorage();
    if (snapshot.makkahHotel?.checkInDate) {
      travelStartDate = new Date(snapshot.makkahHotel.checkInDate);
    }

    const expiryDate = new Date(expiry);

    // Calculate date that is 6 months after travel start
    const sixMonthsAfterTravel = new Date(travelStartDate);
    sixMonthsAfterTravel.setMonth(sixMonthsAfterTravel.getMonth() + 6);

    // Expiry date must be AFTER the 6-month threshold
    return expiryDate > sixMonthsAfterTravel;
  }

  /**
   * Handle photo file selection for visa document
   */
  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // 1. Validate File using shared utility
    const validation = validateImageFile(file);
    if (!validation.valid) {
      this.notificationService.error(validation.error || 'Invalid file', 'Validation Error');
      return;
    }

    // 2. Create preview and upload original file (no WebP conversion)
    // Backend currently only supports JPEG/PNG
    this.notificationService.info('Processing image...', 'Please wait');

    // Create local preview from original file
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.passenger.photoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Upload original file to server
    this.notificationService.info('Uploading photo...', 'Please wait');
    this.uploadService.uploadTravelerPhoto(file).subscribe({
      next: (photoUrl) => {
        this.passenger.photoUrl = photoUrl;
        this.savePassengerData();
        this.notificationService.success('Photo uploaded successfully', 'Photo Added');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Photo upload failed:', err);
        console.error('Error status:', err.status);
        console.error('Error URL:', err.url);
        console.error('Error details:', err.error);

        let errorMsg = 'Failed to upload photo. ';
        if (err.status === 0) {
          errorMsg += 'Backend server is not responding. Please check if backend is running.';
        } else if (err.status === 401) {
          errorMsg += 'Authentication required. Please login again.';
        } else if (err.status === 400) {
          errorMsg += err.error?.message || 'Invalid file format.';
        } else {
          errorMsg += 'Please try again.';
        }

        this.notificationService.error(errorMsg, 'Upload Error');
        this.passenger.photoUrl = null;
        this.cdr.markForCheck();
      }
    });
  }

}

