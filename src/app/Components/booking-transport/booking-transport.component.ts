import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TransportService } from 'src/app/core/services/transport.service';
import { BookingTransportService } from 'src/app/core/services/booking-transport.service';
import { BookingsService } from 'src/app/core/services/bookings.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-booking-transport',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-transport.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingTransportComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly transportService = inject(TransportService);
  private readonly bookingTransportService = inject(BookingTransportService);
  private readonly bookingsService = inject(BookingsService);
  private readonly auth = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  transport: any = null;
  seats: number = 1;
  pricePerSeat: number = 0;
  total: number = 0;
  isSubmitting = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('transportId')) || null;

    // If navigation state included transport object, prefer it
    const navState: any = (history && (history.state as any)) || {};
    if (navState && navState.transport) {
      this.transport = navState.transport;
      this.pricePerSeat = Number(this.transport?.price || this.transport?.pricePerSeat || 0);
      this.recalculateTotal();
      return;
    }

    if (id) {
      this.transportService.getInternationalById(id).subscribe({
        next: (res) => {
          this.transport = res;
          this.pricePerSeat = Number(res?.price || res?.pricePerSeat || 0);
          this.recalculateTotal();
          this.cdr.markForCheck();
        },
        error: (err) => {

          this.notificationService.error('Failed to load transport details', 'Error');
          this.router.navigate(['/transport']);
        }
      });
    } else {
      this.notificationService.error('Missing transport id', 'Error');
      this.router.navigate(['/transport']);
    }
  }

  recalculateTotal() {
    this.total = (Number(this.pricePerSeat) || 0) * (Number(this.seats) || 1);
  }

  submit() {
    if (!this.transport) return;
    this.isSubmitting = true;

    // ✅ SIMPLIFIED: Backend only needs transportId and numberOfSeats
  const payload = {
    transportId: this.transport.id || this.transport.transportId || this.transport.internationalTransportId,
    numberOfSeats: this.seats
  };

    this.bookingTransportService.bookTransport(payload).subscribe({
      next: (res: any) => {
        this.notificationService.success('Transport booked successfully', 'Success');
        // Refresh pending transport drafts and save to local draft
        this.bookingsService.getMyPendingTransportBookings().subscribe({
          next: (pending) => {
            try {
              const current = this.auth.getBookingData() || {};
              const draft: any = { ...(current || {}) };
              if (pending && pending.length) {
                const latest = pending[pending.length - 1];
                draft.transportData = latest;
                // Store server's bookingId
                if (latest.bookingId) {
                  draft.bookingId = latest.bookingId;
                }
              } else {
                draft.transportData = payload;
              }
              this.auth.saveBookingData(draft);
            } catch (e) {

            }

            // After booking transport redirect to booking package to complete passenger/payment
            this.router.navigate(['/booking-package']);
          },
          error: (err) => {

            this.router.navigate(['/booking-package']);
          }
        });
      },
      error: (err: any) => {

        const msg = err?.error?.message || 'Failed to book transport';
        this.notificationService.error(msg);
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
      complete: () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  cancel() {
    this.router.navigate(['/transport']);
  }
}
