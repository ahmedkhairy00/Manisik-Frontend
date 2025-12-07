import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TransportService } from 'src/app/core/services/transport.service';
import { BookingGroundService } from 'src/app/core/services/booking-ground.service';
import { BookingsService } from 'src/app/core/services/bookings.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-booking-ground',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-ground.component.html'
})
export class BookingGroundComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly transportService = inject(TransportService);
  private readonly bookingGroundService = inject(BookingGroundService);
  private readonly bookingsService = inject(BookingsService);
  private readonly auth = inject(AuthService);
  private readonly toastr = inject(ToastrService);

  ground: any = null;
  passengers: number = 1;
  pricePerPerson: number = 0;
  total: number = 0;
  pickupLocation: string = '';
  dropoffLocation: string = '';
  isSubmitting = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('groundTransportId')) || null;

    const navState: any = (history && (history.state as any)) || {};
    if (navState && navState.groundTransport) {
      this.ground = navState.groundTransport;
      this.pricePerPerson = Number(this.ground?.pricePerPerson || this.ground?.price || 0);
      this.pickupLocation = this.ground.pickupLocation || this.ground.from || '';
      this.dropoffLocation = this.ground.dropoffLocation || this.ground.to || '';
      this.recalculateTotal();
      return;
    }

    if (id) {
      this.transportService.getGroundById(id).subscribe({
        next: (res) => {
          this.ground = res;
          this.pricePerPerson = Number(res?.pricePerPerson || res?.price || 0);
          this.pickupLocation = res.pickupLocation || res.from || '';
          this.dropoffLocation = res.dropoffLocation || res.to || '';
          this.recalculateTotal();
        },
        error: (err) => {
          console.error('Failed to load ground transport', err);
          this.toastr.error('Failed to load ground transport details', 'Error');
          this.router.navigate(['/transport']);
        }
      });
    } else {
      this.toastr.error('Missing ground transport id', 'Error');
      this.router.navigate(['/transport']);
    }
  }

  recalculateTotal() {
    this.total = (Number(this.pricePerPerson) || 0) * (Number(this.passengers) || 1);
  }

  submit() {
    if (!this.ground) return;
    if (!this.pickupLocation || !this.dropoffLocation) {
      this.toastr.warning('Please fill pickup and dropoff locations', 'Validation');
      return;
    }
    this.isSubmitting = true;

    // ✅ SIMPLIFIED: Only send required fields
  const payload = {
    groundTransportId: this.ground.id || this.ground.groundTransportId,
    serviceDate: new Date().toISOString(),
    pickupLocation: this.pickupLocation,
    dropoffLocation: this.dropoffLocation,
    numberOfPassengers: this.passengers
    
  };

    this.bookingGroundService.bookGround(payload).subscribe({
      next: (res: any) => {
        this.toastr.success('Ground transport booked successfully', 'Success');
        // Refresh pending ground drafts and save to local draft
        this.bookingsService.getMyPendingGroundBookings().subscribe({
          next: (pending) => {
            try {
              const current = this.auth.getBookingData() || {};
              const draft: any = { ...(current || {}) };
              if (pending && pending.length) {
                const latest = pending[pending.length - 1];
                draft.groundData = latest;
                // Store server's bookingId
                if (latest.bookingId) {
                  draft.bookingId = latest.bookingId;
                }
              } else {
                draft.groundData = res.data; // ✅ Use response data, not payload
              }
              this.auth.saveBookingData(draft);
            } catch (e) {
              console.warn('Failed to save pending ground to local draft', e);
            }

            // After booking ground redirect to booking package to complete passenger/payment
            this.router.navigate(['/booking-package']);
          },
          error: (err) => {
            console.warn('Failed to refresh pending ground transports', err);
            this.router.navigate(['/booking-package']);
          }
        });
      },
      error: (err: any) => {
        console.error('Booking ground transport failed', err);
        const msg = err?.error?.message || 'Failed to book ground transport';
        this.toastr.error(msg);
        this.isSubmitting = false;
      },
      complete: () => (this.isSubmitting = false),
    });
  }

  cancel() {
    this.router.navigate(['/transport']);
  }
}
