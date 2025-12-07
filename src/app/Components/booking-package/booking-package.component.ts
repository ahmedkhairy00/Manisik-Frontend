import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
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
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import {
  loadStripe,
  Stripe,
  StripeCardElement,
  StripeElements,
} from '@stripe/stripe-js';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { BookingsService } from '../../core/services/bookings.service';
import { CreateBookingRequest, TripType } from '../../interfaces/booking.interface';

type BookingSnapshot = {
  makkahHotel: any;
  madinahHotel: any;
  internationalTransport: any;
  groundTransport: any;
};

import { I18nService } from '../../core/services/i18n.service';
import { CountriesService, Country } from '../../core/services/countries.service';

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
  Trash2
} from 'lucide-angular';

@Component({
  selector: 'app-booking-package',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LucideAngularModule
  ],
  templateUrl: './booking-package.component.html',
  styleUrls: ['./booking-package.component.css'],
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
  selectedPhoneCountry: Country | null = null;

  passenger = {
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
  };

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

  constructor(
    private hotelApi: HotelsService,
    private router: Router,
    private paymentService: PaymentService,
    private bookingsService: BookingsService,
    private toastr: ToastrService,
    private auth: AuthService,
    public i18nService: I18nService,
    private countriesService: CountriesService
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
    this.loadHotels();

    // CRITICAL FIX: storage depends on user ID, so we must wait for auth check
    this.auth.currentUser$.subscribe(user => {
       // Only run initialization logic once we have a definitive user state (null or Object)
       // Note: currentUser$ starts as null, so we might want to skip the very first emission if it's default value
       // But auth service checkAuth() emits quickly. 
       
       this.ensureBookingId();
       this.loadPassengerData();
       this.checkBookingStatus();
       
       // If local draft is missing or partial, try load pending pieces from server
       this.loadPendingFromServerIfMissing();
    });
  }

  ngOnDestroy(): void {
    this.cleanupStripe();
  }

  // ---------------- Hotel & Transport Status ----------------
  private loadHotels() {
    this.hotelApi.getHotels().subscribe({
      next: (data) => (this.hotels = data),
      error: (err) => console.error('Error loading hotels', err),
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

      const draft: any = {};
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
        console.log('📦 Synced pending bookings from server:', {
          bookingId: serverBookingId,
          makkah: !!draft.makkahHotelData,
          madinah: !!draft.madinahHotelData,
          ground: !!draft.groundData,
          transport: !!draft.transportData
        });
      } else {
        // Server has no pending data - clear local storage to stay in sync
        console.log('🧹 Server reported no pending bookings. Clearing local storage.');
        this.auth.clearUserBookingData();
        this.bookingId = 0;
      }

      // Re-evaluate status
      this.checkBookingStatus();
    } catch (err) {
      // non-fatal
      console.warn('Failed to load pending drafts from server', err);
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
    };
    
    console.log('🔄 Booking status reset for new booking');
  }

  /**
   * Public manual reset for user "Start Fresh"
   */
  async resetBooking() {
     const confirm = window.confirm(this.i18nService.t('Are you sure you want to clear all booking data and start fresh?'));
     if(!confirm) return;

     this.auth.clearUserBookingData();
     this.resetBookingStatus();
     
     // Generate new ID immediately
     this.ensureBookingId();
     
     this.toastr.info('Booking form has been reset.', 'Cleared');
     
     // Force reload to ensure no lingering state provided by services
     // window.location.reload(); 
     // OR just re-init checks
     this.checkBookingStatus();
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
      this.toastr.error('لا يمكن المتابعة بدون إجمالي تكلفة صالح.', 'خطأ');
      return;
    }

    // Validate Passport Expiry (Must be > 6 months from travel start)
    const travelStartDate = new Date(snapshot.makkahHotel?.checkInDate || new Date());
    const sixMonthsFromTravel = new Date(travelStartDate);
    sixMonthsFromTravel.setMonth(sixMonthsFromTravel.getMonth() + 6);

    if (this.passenger.passportExpiry) {
      const passportExpiry = new Date(this.passenger.passportExpiry);
      if (passportExpiry < sixMonthsFromTravel) {
        this.toastr.error('Passport expiry date must be more than 6 months from the travel date.', 'Error');
        return;
      }
    }

    this.isFinalizing = true;

    try {
      // Create booking and get id
      const savedBookingId = await this.saveBooking(snapshot);

      console.log('🎯 Booking saved with ID:', savedBookingId);

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
    } catch (err) {
      console.error('❌ Finalize booking error', err);
      this.toastr.error('فشل في حفظ الحجز. الرجاء المحاولة مرة أخرى.', 'خطأ');
      this.isFinalizing = false;
    }
  }

  private async saveBooking(snapshot: BookingSnapshot): Promise<number | string> {
  const makkahCheckIn = snapshot.makkahHotel?.checkInDate;
  const madinahCheckOut = snapshot.madinahHotel?.checkOutDate;

  // ✅ Clean payload - only send what backend needs for CREATE
  const payload: CreateBookingRequest = {
    type: this.selectedTripType === 'umrah' ? TripType.Umrah : TripType.Hajj,
    travelStartDate: makkahCheckIn || new Date().toISOString(),
    travelEndDate: madinahCheckOut || new Date().toISOString(),
    numberOfTravelers: 1,
    
    // ✅ Only send essential hotel data (not bookingId or bookingHotelId)
    makkahHotel: {
      hotelId: snapshot.makkahHotel?.hotelId,
      roomId: snapshot.makkahHotel?.roomId,
      city: 'Makkah', // ✅ Required by backend HotelBookingDto
      checkInDate: snapshot.makkahHotel?.checkInDate,
      checkOutDate: snapshot.makkahHotel?.checkOutDate,
      numberOfRooms: snapshot.makkahHotel?.numberOfRooms || 1,
      totalPrice: snapshot.makkahHotel?.totalPrice
    },
    
    madinahHotel: {
      hotelId: snapshot.madinahHotel?.hotelId,
      roomId: snapshot.madinahHotel?.roomId,
      city: 'Madinah', // ✅ Required by backend HotelBookingDto
      checkInDate: snapshot.madinahHotel?.checkInDate,
      checkOutDate: snapshot.madinahHotel?.checkOutDate,
      numberOfRooms: snapshot.madinahHotel?.numberOfRooms || 1,
      totalPrice: snapshot.madinahHotel?.totalPrice
    },
    
    // ✅ Only send transportId and numberOfSeats
    internationalTransport: {
      transportId: snapshot.internationalTransport?.transportId,
      numberOfSeats: snapshot.internationalTransport?.numberOfSeats,
      totalPrice: snapshot.internationalTransport?.totalPrice
    },
    
    // ✅ Send all required ground transport fields
    groundTransport: {
      groundTransportId: snapshot.groundTransport?.groundTransportId,
      serviceDate: snapshot.groundTransport?.serviceDate || new Date().toISOString(),
      pickupLocation: snapshot.groundTransport?.pickupLocation,
      dropoffLocation: snapshot.groundTransport?.dropoffLocation,
      numberOfPassengers: snapshot.groundTransport?.numberOfPassengers || 1,
      totalPrice: snapshot.groundTransport?.totalPrice
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
      },
    ],
    
    totalPrice: this.totalAmount,
  };

  console.log('📤 Clean Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await firstValueFrom(this.bookingsService.createBooking(payload));
    console.log('✅ Response:', response);

    this.toastr.success('تم إنشاء الحجز بنجاح!', 'نجاح');

    // Extract ID
    const bookingId = (response as any).data?.id || (response as any).data?.bookingId || (response as any).id;

    if (!bookingId) {
      throw new Error('Booking ID not found in response');
    }

    // Booking saved, proceeding to payment
    // Data will be cleared after successful payment in confirmStripePayment
    
    return bookingId;
  } catch (error: any) {
    console.error('❌ Error:', error);
    console.error('❌ Error Response:', error?.error);
    
    const errorMsg = error?.error?.message || error?.error?.title || 'فشل إنشاء الحجز';
    this.toastr.error(errorMsg);
    throw error;
  }
}


  private async initStripePayment() {
    this.paymentError = '';

    try {
      const payload: CreatePaymentRequest = {
        bookingId: this.bookingId,
        currency: (this.stripeConfig?.currency || 'usd').toLowerCase(),
        idempotencyKey: `booking-${this.bookingId}-${Date.now()}`,
      };

      const response = await firstValueFrom(this.paymentService.createPayment(payload));

      if (!response.clientSecret) {
        throw new Error('لم نستلم client secret من Stripe.');
      }

      this.clientSecret = response.clientSecret;
      this.mountStripeCard();

      this.toastr.info('برجاء إدخال بيانات البطاقة لإتمام الدفع.', 'Stripe');
    } catch (error: any) {
      console.error('Stripe init error', error);

      if (error.status === 404) {
        this.toastr.error('نقطة نهاية الدفع غير موجودة. يرجى الاتصال بالدعم.');
      } else {
        const errorMsg = error?.error?.message || 'فشل تهيئة الدفع. الرجاء المحاولة مرة أخرى.';
        this.toastr.error(errorMsg);
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
      });

      if (result.error) {
        this.paymentError = result.error.message || 'فشل الدفع.';
        this.toastr.error(this.paymentError);
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        // IMPORTANT: Call backend to confirm payment and update booking status
        // This ensures the booking is marked as Confirmed before we clear localStorage
        try {
          const confirmResponse = await fetch(`${environment.apiUrl}/Stripe/ConfirmPayment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ paymentIntentId: result.paymentIntent.id })
          });
          
          if (!confirmResponse.ok) {
            console.warn('Failed to confirm payment on backend, webhook will handle it');
          } else {
            console.log('Payment confirmed on backend successfully');
          }
        } catch (confirmErr) {
          console.warn('Error confirming payment on backend:', confirmErr);
          // Don't block - webhook will handle it as fallback
        }

        this.paymentSuccess = 'تم الدفع بنجاح!';
        this.toastr.success(this.paymentSuccess, 'Stripe');
        
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
      console.error('Stripe confirmation error', err);
      this.paymentError = err instanceof Error ? err.message : 'حدث خطأ أثناء الدفع.';
      this.toastr.error(this.paymentError);
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
    this.toastr.info('Payment cancelled', 'Info');
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
      this.toastr.warning('يجب حجز فندق في مكة وآخر في المدينة قبل المتابعة.', 'الفنادق مطلوبة');
      return null;
    }

    if (!snapshot.internationalTransport || !snapshot.groundTransport) {
      this.toastr.warning('يجب إكمال حجز النقل الدولي والنقل البري.', 'النقل مطلوب');
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
    const snapshot = this.getBookingSnapshotFromStorage();
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
    return this.getBookingSnapshotFromStorage().makkahHotel;
  }
  get madinahHotelData() {
    return this.getBookingSnapshotFromStorage().madinahHotel;
  }
  get transportData() {
    return this.getBookingSnapshotFromStorage().internationalTransport;
  }
  get groundData() {
    return this.getBookingSnapshotFromStorage().groundTransport;
  }

  private loadPassengerData() {
    const userData = this.auth.getBookingData();
    if (userData?.passengerData) {
      this.passenger = userData.passengerData;
    }
  }

  savePassengerData() {
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
    this.cardElement = this.elements.create('card', { hidePostalCode: true });
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
    if (!p.firstName || !p.lastName || !p.email || !p.phone || !p.passport || !p.passportExpiry || !p.nationality) {
      this.toastr.warning('Please complete all passenger information', 'Missing Data');
      return false;
    }

    if (!p.passportIssuingCountry) {
      this.toastr.warning('Please select a passport issuing country', 'Missing Data');
      return false;
    }
    
    return true;
  }

}
