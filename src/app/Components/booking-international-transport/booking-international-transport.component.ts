import { Component, Input, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TransportOption } from 'src/app/interfaces';
import { BookingInternationalTransport } from 'src/app/interfaces/booking-international-transport';
import { BookingInternationalTransportService } from 'src/app/core/services/booking-international-transport.service';
import { RouterModule, Router } from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { BookingsService } from 'src/app/core/services/bookings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-booking-international-transport',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-international-transport.component.html',
  styleUrls: ['./booking-international-transport.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingInternationalTransportComponent implements OnInit, OnDestroy {
  @Input() selectedDepartureFlight!: TransportOption;

  private readonly auth = inject(AuthService);
  private readonly bookingsService = inject(BookingsService);
  private readonly router = inject(Router);
  
  bookingForm!: FormGroup;

  totalBookingPrice = 0;
  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingInternationalTransportService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const nav = history.state;
    this.selectedDepartureFlight = nav.selectedFlight;
    if (!this.selectedDepartureFlight) {
      return;
    }

    this.bookingForm = this.fb.group({
      departureBooking: this.fb.group({
        transportId: [this.selectedDepartureFlight.id, Validators.required],
        numberOfSeats: [
          1,
          [
            Validators.required,
            Validators.min(1),
            Validators.max(this.selectedDepartureFlight.availableSeats),
          ],
        ],
      }),
    });
    
    this.calculateTotals();

    // Subscribe to changes to update price live
    this.subs.add(
      this.bookingForm.get('departureBooking.numberOfSeats')?.valueChanges.subscribe(() => {
        this.calculateTotals();
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
      this.subs.unsubscribe();
  }

  calculateTotals() {
    const seats = this.bookingForm.get('departureBooking.numberOfSeats')?.value || 1;
    this.totalBookingPrice = seats * this.selectedDepartureFlight.price;
  }

  submitBooking() {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    const seats = this.bookingForm.get('departureBooking.numberOfSeats')?.value || 1;

    // Get existing bookingId from localStorage if available
    const existingData = this.auth.getBookingData() || {};
    const currentBookingId = existingData.bookingId || null;

    // Simple single payload - ID covers the whole package (One Way or Round Trip)
    const bookingPayload: BookingInternationalTransport = {
      TransportId: +this.selectedDepartureFlight.id!,
      NumberOfSeats: seats,
      Status: 0, // Pending
      PricePerSeat: this.selectedDepartureFlight.price,
      TotalPrice: this.totalBookingPrice,
      BookingId: currentBookingId, 
    };

    this.bookingService.bookTransport(bookingPayload).subscribe({
      next: (response: any) => {
        const returnedBookingId = response?.data?.bookingId || response?.data?.BookingId || response?.bookingId;
        
        if (returnedBookingId) {
          const current = this.auth.getBookingData() || {};
          current.bookingId = returnedBookingId;
          this.auth.saveBookingData(current);
        }

        this.notificationService.success('Flight booked successfully!', 'Success');

        // Sync transport data to localStorage
        this.bookingsService.getMyPendingTransportBookings().subscribe({
          next: (pending) => {
            const current = this.auth.getBookingData() || {};
            
            if (pending && pending.length > 0) {
              current.transportData = pending[pending.length - 1]; // Use latest
              if (pending[pending.length - 1].bookingId) {
                current.bookingId = pending[pending.length - 1].bookingId;
              }
            } else {
              // Fallback local data
              current.transportData = {
                bookingId: returnedBookingId || current.bookingId,
                transportId: this.selectedDepartureFlight.id,
                carrierName: this.selectedDepartureFlight.carrierName,
                flightClass: this.selectedDepartureFlight.flightClass,
                departureDate: this.selectedDepartureFlight.departureDate,
                returnDate: this.selectedDepartureFlight.returnDate,
                totalPrice: this.totalBookingPrice,
                numberOfSeats: seats
              };
            }
            
            this.auth.saveBookingData(current);
            this.router.navigate(['/transport'], { queryParams: { tab: 'ground' } });
          },
          error: () => {
             // Fallback on error
             const current = this.auth.getBookingData() || {};
             current.transportData = {
                bookingId: returnedBookingId || current.bookingId,
                transportId: this.selectedDepartureFlight.id,
                carrierName: this.selectedDepartureFlight.carrierName,
                flightClass: this.selectedDepartureFlight.flightClass,
                departureDate: this.selectedDepartureFlight.departureDate,
                returnDate: this.selectedDepartureFlight.returnDate,
                totalPrice: this.totalBookingPrice,
                numberOfSeats: seats
              };
              this.auth.saveBookingData(current);
              this.router.navigate(['/transport'], { queryParams: { tab: 'ground' } });
          }
        });
      },
      error: (err) => {
        const backendMessage = err?.error?.message ?? 'Something went wrong';
        this.notificationService.error(backendMessage, 'Booking Failed');
        this.cdr.markForCheck();
      },
    });
  }
}
