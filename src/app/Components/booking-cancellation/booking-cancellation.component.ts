import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Router, ActivatedRoute } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-booking-cancellation',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './booking-cancellation.component.html',
  styleUrl: './booking-cancellation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingCancellationComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public i18n = inject(I18nService);
  private cdr = inject(ChangeDetectorRef);

  bookingId: string | null = null;

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.bookingId = params.get('bookingId');
      this.cdr.markForCheck();
    });
  }

  retryPayment() {
    this.router.navigate(['/booking-package']);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}

