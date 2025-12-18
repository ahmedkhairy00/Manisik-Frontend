import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HotelsService } from 'src/app/core/services/hotels.service';
import { LucideAngularModule } from 'lucide-angular';
import { Room } from 'src/app/interfaces';
import { I18nService } from 'src/app/core/services/i18n.service';

/**
 * HotelDetailsComponent
 * - Standalone component that fetches hotel by id using HotelsService.getHotelById
 * - Displays all hotel information including image, name, price, distance, city, rate, and description
 * - This component is responsible only for presentation and fetching; actions (booking, review)
 *   can be implemented by other services.
 */
@Component({
  selector: 'app-hotel-details',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './hotel-details.component.html',
  styleUrls: ['./hotel-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HotelDetailsComponent implements OnInit {
  readonly i18n = inject(I18nService);
  showRooms = false; // toggles rooms display
  selectedRoom?: Room;
  loading = true;
  hotel: any = null;
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  constructor(private hotelsService: HotelsService, private router: Router) {}

  getImageUrl(hotel: any): string {
    return this.hotelsService.getImageUrl(hotel);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }

    this.hotelsService.getHotelById(id).subscribe({
      next: (h) => {
        this.hotel = h;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {

        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }
  toggleRooms() {
    this.showRooms = !this.showRooms;
  }

  selectRoom(room: Room) {
    if (!room.isActive) {
      return;
    }

    this.selectedRoom = room;
  }

  bookSelectedRoom() {
    if (!this.hotel || !this.selectedRoom) return;
    this.router.navigate(['/booking-hotel'], {
      queryParams: { hotelId: this.hotel.id, roomId: this.selectedRoom.id },
    });
  }

  // Book a specific room directly (called from Book button)
  bookRoom(room: Room) {
    if (!this.hotel || !room) return;
    this.router.navigate(['/booking-hotel'], {
      queryParams: { hotelId: this.hotel.id, roomId: room.id },
    });
  }

  formatPrice(price: number) {
    return price?.toFixed(2);
  }
}
