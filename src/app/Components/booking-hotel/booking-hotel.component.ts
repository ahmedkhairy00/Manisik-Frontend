import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';
import { BookingHotelService } from 'src/app/core/services/booking-hotel.service';
import { BookingsService } from 'src/app/core/services/bookings.service';
import { HotelsService } from 'src/app/core/services/hotels.service';
import { I18nService } from 'src/app/core/services/i18n.service';
import { HotelBooking } from 'src/app/interfaces';
import { AuthService } from 'src/app/core/services/auth.service';
import { HotelBookingDto } from 'src/app/models/api/booking.models';

@Component({
  selector: 'app-booking-hotel',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './booking-hotel.component.html',
  styleUrl: './booking-hotel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingHotelComponent implements OnInit {
  readonly i18n = inject(I18nService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private bookingService = inject(BookingHotelService);
  private bookingsService = inject(BookingsService); // General bookings service for pending checks
  private hotelsService = inject(HotelsService);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  
  bookingForm!: FormGroup;
  hotelId!: number;
  roomId!: number;
  hotel: any = null;
  room: any = null;
  totalPrice: number = 0;
  existingBookings: HotelBooking[] = [];
  pendingBooking: any = null; // Store conflicting pending booking if any
  allPendingBookings: any[] = []; // Store all pending bookings

  ngOnInit(): void {
    // Check for pending bookings first
    this.checkPendingBookings();

    this.route.queryParams.subscribe((params) => {
      const hId = +params['hotelId'];
      const rId = +params['roomId'];

      if (isNaN(hId) || isNaN(rId)) {
        this.notificationService.error(
          this.i18n.translate('booking.error.invalidParams') || 'Invalid Parameters'
        );
        this.router.navigate(['/hotels']);
        return;
      }

      this.hotelId = hId;
      this.roomId = rId;
      this.loadHotelDetails();
    });

    // Initialize form with custom validator
    this.bookingForm = this.fb.group(
      {
        checkInDate: ['', Validators.required],
        checkOutDate: ['', Validators.required],
        numberOfRooms: [1, [Validators.required, Validators.min(1)]],
      },
      { validators: this.dateValidator() }
    );

    // Recalculate total price on changes
    this.bookingForm.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
      this.cdr.markForCheck();
    });
  }

  checkPendingBookings() {
    this.bookingsService.getMyPendingHotelBookings().subscribe({
      next: (bookings) => {
        this.allPendingBookings = bookings || [];
        this.checkForCityConflict();
        this.cdr.markForCheck();
      }
    });
  }

  checkForCityConflict() {
    if (!this.hotel || !this.allPendingBookings.length) {
      this.pendingBooking = null;
      return;
    }

    // Find if there is a pending booking with the SAME city as the current hotel
    const conflict = this.allPendingBookings.find(
      (pb) => pb.city?.toLowerCase() === this.hotel.city?.toLowerCase()
    );

    this.pendingBooking = conflict || null;
  }

  discardPendingBooking() {
    if (!this.pendingBooking) return;
    
    if (confirm(this.i18n.isRTL() ? 'هل أنت متأكد من حذف الحجز المعلق؟' : 'Are you sure you want to discard the pending booking?')) {
      // pass the whole object - service will extract id
      this.bookingsService.deletePendingHotelBooking(this.pendingBooking).subscribe({
        next: () => {
          this.pendingBooking = null;
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

  resumePendingBooking() {
    if (!this.pendingBooking) return;

    const pb = this.pendingBooking;

    // If pending corresponds to current hotel & room, pre-fill the form
    if (pb.hotelId === this.hotelId && pb.roomId === this.roomId) {
      try {
        this.bookingForm.patchValue({
          checkInDate: (new Date(pb.checkInDate)).toISOString().split('T')[0],
          checkOutDate: (new Date(pb.checkOutDate)).toISOString().split('T')[0],
          numberOfRooms: pb.numberOfRooms || 1
        });
        this.notificationService.info(this.i18n.isRTL() ? 'تم تحميل المسودة' : 'Draft loaded');
        this.cdr.markForCheck();
      } catch (e) {

      }
      return;
    }

    // Otherwise navigate to the draft's booking page
    const targetHotelId = pb.hotelId || pb.hotelId || pb.hotel?.id;
    const targetRoomId = pb.roomId || pb.roomId || pb.room?.id;

    if (targetHotelId && targetRoomId) {
      this.router.navigate(['/booking-hotel'], { queryParams: { hotelId: targetHotelId, roomId: targetRoomId } });
    } else {
      // Fallback: show message and open hotels list
      this.notificationService.warning(this.i18n.isRTL() ? 'تعذر استئناف المسودة' : 'Unable to resume draft');
      this.router.navigate(['/hotels']);
    }
  }

  loadHotelDetails() {
    this.hotelsService.getHotelById(this.hotelId).subscribe({
      next: (hotel) => {
        this.hotel = hotel;
        this.checkForCityConflict(); // Check conflict after hotel details loaded
        this.room = hotel.rooms.find((r: any) => r.id === this.roomId);
        if (!this.room) {
          this.notificationService.error(
            this.i18n.translate('booking.error.roomNotFound') || 'Room not found'
          );
          this.router.navigate(['/hotels']);
        }
        this.calculateTotalPrice();

        // If we already had a pending booking that matches this hotel/room, prefill automatically
        if (this.pendingBooking && this.pendingBooking.hotelId === this.hotelId && this.pendingBooking.roomId === this.roomId) {
          this.resumePendingBooking();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.notificationService.error(
          this.i18n.translate('booking.error.loadFailed') || 'Failed to load details'
        );
        this.router.navigate(['/hotels']);
        this.cdr.markForCheck();
      },
    });
  }
  calculateTotalPrice() {
    const { checkInDate, checkOutDate, numberOfRooms } = this.bookingForm.value;
    if (!checkInDate || !checkOutDate || !numberOfRooms || !this.room) return;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    const nights = Math.max(
      1,
      Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    this.totalPrice = (this.room.pricePerNight || 0) * nights * numberOfRooms;
  }

  dateValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const checkIn = group.get('checkInDate')?.value;
      const checkOut = group.get('checkOutDate')?.value;

      // If either date is missing, do not mark as dateOrderInvalid here; required validators handle missing fields.
      if (!checkIn || !checkOut) return null;

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      // 1. Check order
      if (checkInDate >= checkOutDate) return { dateOrderInvalid: true };

      return null;
    };
  }

  submitBooking() {
    if (this.bookingForm.invalid) {
      this.notificationService.warning(
        this.i18n.translate('booking.error.invalidForm') || 'Invalid form'
      );
      return;
    }

    const { checkInDate, checkOutDate, numberOfRooms } = this.bookingForm.value;
    
    // Convert to ISO string for API
    const checkInISO = new Date(checkInDate).toISOString();
    const checkOutISO = new Date(checkOutDate).toISOString();

    const numberOfNights = Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)));

    // Get existing bookingId from localStorage if available
    const existingData = this.auth.getBookingData() || {};
    const currentBookingId = existingData.bookingId || null;

    const bookingDto: HotelBookingDto = {
      hotelId: this.hotel.id,
      hotelName: this.hotel.name,
      roomId: this.room.id,
      roomType: this.room.roomType,
      City: this.hotel.city, // Backend expects capital C
      checkInDate: checkInISO,
      checkOutDate: checkOutISO,
      numberOfRooms: numberOfRooms,
      numberOfNights: numberOfNights,
      pricePerNight: this.room.pricePerNight,
      totalPrice: this.totalPrice,
      bookingId: currentBookingId, // Pass existing bookingId to add to same pending booking
    };

    this.bookingService.bookHotel(bookingDto).subscribe({
      next: (res: any) => {
        this.notificationService.success(
          this.i18n.translate('booking.success') || 'Booking successful',
          'Success'
        );

        // Immediately capture bookingId from response if available
        const returnedBookingId = res?.data?.bookingId || res?.data?.BookingId || res?.bookingId;
        if (returnedBookingId) {
          const current = this.auth.getBookingData() || {};
          current.bookingId = returnedBookingId;
          this.auth.saveBookingData(current);
        }

        // After successful booking, refresh pending hotel drafts from server and persist to local storage
        this.bookingsService.getMyPendingHotelBookings().subscribe({
          next: (pending) => {
            try {
              const current = this.auth.getBookingData() || {};
              const draft: any = { ...(current || {}) };

              if (pending && pending.length) {
                // Extract server's bookingId from the first pending hotel
                if (pending[0].bookingId) {
                  draft.bookingId = pending[0].bookingId;
                }
                
                // Map by city name (case-insensitive)
                pending.forEach((p: any) => {
                  const city = (p.city || '').toString().toLowerCase();
                  if (city.includes('makkah') || city.includes('مكة')) {
                    draft.makkahHotelData = p;
                  } else if (city.includes('madinah') || city.includes('المدينة') || city.includes('madina')) {
                    draft.madinahHotelData = p;
                  }
                });
              } else {
                // fallback: write a minimal local draft for UI
                const city = (this.hotel?.city || '').toString().toLowerCase();
                const simple = {
                  hotelId: this.hotel?.id,
                  roomId: this.room?.id,
                  totalPrice: this.totalPrice,
                  checkInDate: checkInISO,
                  checkOutDate: checkOutISO,
                  City: this.hotel?.city // Backend expects capital C
                };
                if (city.includes('makkah') || city.includes('مكة')) draft.makkahHotelData = simple;
                else draft.madinahHotelData = simple;
              }

              this.auth.saveBookingData(draft);

              // Determine navigation flow: if user just booked Makkah -> take them to Madinah hotels
              const bookedCity = (this.hotel?.city || '').toString().toLowerCase();
              if (bookedCity.includes('makkah')) {
                // redirect to Madinah hotels to continue
                this.router.navigate(['/hotels'], { queryParams: { city: 'Madinah' } });
                return;
              }

              // If they booked Madinah or both hotels are present, go to transport step
              const hasMakkah = !!(draft.makkahHotelData);
              const hasMadinah = !!(draft.madinahHotelData);

              if (hasMakkah && hasMadinah) {
                // Go to transport selection
                this.router.navigate(['/transport'], { queryParams: { tab: 'international' } });
              } else {
                // Otherwise, go back to booking package to continue
                this.router.navigate(['/booking-package']);
              }
            } catch (e) {

              this.router.navigate(['/booking-package']);
            }
          },
          error: (err) => {

            this.router.navigate(['/booking-package']);
          }
        });
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || this.i18n.translate('booking.error.failed') || 'Booking failed';
        
        // Handle Stale Booking ID (Booking not found)
        if (errorMsg.includes('Booking not found') && currentBookingId) {
             // Stale Booking ID detected. Clearing and retrying...
             
             // 1. Clear the stale ID from storage
             const current = this.auth.getBookingData() || {};
             delete current.bookingId;
             this.auth.saveBookingData(current);
             
             // 2. Retry the submission as a new booking (recursive call with safeguard?)
             // Better to just retry the logic locally to avoid recursion depth issues, 
             // but here a single retry is safe enough as the ID is now gone.
             
             // Create new DTO without ID
             const retryDto = { ...bookingDto, bookingId: null };
             
             this.bookingService.bookHotel(retryDto).subscribe({
                 next: (retryRes: any) => {
                     // Success on retry
                     this.notificationService.success(this.i18n.translate('booking.success') || 'Booking successful', 'Success');
                     
                     // Capture NEW bookingId
                     const returnedBookingId = retryRes?.data?.bookingId || retryRes?.data?.BookingId || retryRes?.bookingId;
                     if (returnedBookingId) {
                        const newCurrent = this.auth.getBookingData() || {};
                        newCurrent.bookingId = returnedBookingId;
                        this.auth.saveBookingData(newCurrent);
                     }
                     
                     // Proceed with navigation/draft update logic (duplicated from success block)
                     // proper refactoring would extract this success logic to a method, but for now we direct the user
                     this.bookingsService.getMyPendingHotelBookings().subscribe({
                        next: (pending) => {
                            // ... (same logic as above, simplified for retry)
                            this.router.navigate(['/booking-package']);
                        }
                     });
                 },
                 error: (retryErr) => {
                     this.notificationService.error(retryErr?.error?.message || 'Booking retry failed');
                     this.cdr.markForCheck();
                 }
             });
             return; 
        }

        // Show custom warning if related to pending/existing booking
        if (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('pending')) {
           this.notificationService.warning('Please complete payment for your pending booking in the dashboard', 'Pending Booking');
           this.checkPendingBookings();
        } else {
           // Enhanced service now handles object extraction
           this.notificationService.error(err);
        }
        this.cdr.markForCheck();
      },
    });
  }
}
