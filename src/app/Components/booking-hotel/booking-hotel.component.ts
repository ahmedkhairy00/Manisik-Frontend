import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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
import { ToastrService } from 'ngx-toastr';
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
})
export class BookingHotelComponent implements OnInit {
  readonly i18n = inject(I18nService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private bookingService = inject(BookingHotelService);
  private bookingsService = inject(BookingsService); // General bookings service for pending checks
  private hotelsService = inject(HotelsService);
  private route = inject(ActivatedRoute);
  private toastr = inject(ToastrService);
  private auth = inject(AuthService);
  
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
        this.toastr.error(
          this.i18n.translate('booking.error.invalidParams'),
          this.i18n.translate('error')
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
    this.bookingForm.valueChanges.subscribe(() => this.calculateTotalPrice());
  }

  checkPendingBookings() {
    this.bookingsService.getMyPendingHotelBookings().subscribe({
      next: (bookings) => {
        this.allPendingBookings = bookings || [];
        this.checkForCityConflict();
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
        this.toastr.info(this.i18n.isRTL() ? 'تم تحميل المسودة' : 'Draft loaded');
      } catch (e) {
        console.warn('Failed to prefill from pending booking', e);
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
      this.toastr.warning(this.i18n.isRTL() ? 'تعذر استئناف المسودة' : 'Unable to resume draft');
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
          this.toastr.error(
            this.i18n.translate('booking.error.roomNotFound'),
            this.i18n.translate('error')
          );
          this.router.navigate(['/hotels']);
        }
        this.calculateTotalPrice();

        // If we already had a pending booking that matches this hotel/room, prefill automatically
        if (this.pendingBooking && this.pendingBooking.hotelId === this.hotelId && this.pendingBooking.roomId === this.roomId) {
          this.resumePendingBooking();
        }
      },
      error: (err) => {
        this.toastr.error(
          this.i18n.translate('booking.error.loadFailed'),
          this.i18n.translate('error')
        );
        this.router.navigate(['/hotels']);
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
      this.toastr.warning(
        this.i18n.translate('booking.error.invalidForm'),
        this.i18n.translate('warning')
      );
      return;
    }

    const { checkInDate, checkOutDate, numberOfRooms } = this.bookingForm.value;
    
    // Convert to ISO string for API
    const checkInISO = new Date(checkInDate).toISOString();
    const checkOutISO = new Date(checkOutDate).toISOString();

    const numberOfNights = Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)));

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
    };

    this.bookingService.bookHotel(bookingDto).subscribe({
      next: (res: any) => {
        this.toastr.success(
          this.i18n.translate('booking.success'),
          this.i18n.translate('success')
        );

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
              console.warn('Failed to update local draft after booking', e);
              this.router.navigate(['/booking-package']);
            }
          },
          error: (err) => {
            console.warn('Failed to refresh pending hotel drafts', err);
            this.router.navigate(['/booking-package']);
          }
        });
      },
      error: (err: any) => {
        // Show only the backend message in toaster
        const errorMsg = err?.error?.message || this.i18n.translate('booking.error.failed');
        this.toastr.error(errorMsg);
        
        // If it's a city conflict, suggest discarding existing booking
        if (errorMsg.toLowerCase().includes('already booked') && errorMsg.toLowerCase().includes('city')) {
          // Refresh pending bookings to show the discard option
          this.checkPendingBookings();
        }
      },
    });
  }
}
