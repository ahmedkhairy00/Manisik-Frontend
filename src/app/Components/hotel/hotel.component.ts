import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HotelsService } from 'src/app/core/services/hotels.service';
import { I18nService } from 'src/app/core/services/i18n.service';
import { Hotel, HotelSearchParams } from 'src/app/interfaces/hotel.interface';
import { LucideAngularModule } from 'lucide-angular';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-hotel',
  imports: [FormsModule, CommonModule, LucideAngularModule],
  templateUrl: './hotel.component.html',
  styleUrl: './hotel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelComponent implements OnInit {
  readonly i18n = inject(I18nService);

  viewMode: 'grid' | 'list' = 'grid';
  searchText: string = '';

  // 👇 القيم اللي الـ backend فاهمها
  city: 'All' | 'Makkah' | 'Madinah' = 'All';

  sortBy: string = 'recommended';
  loading = false;

  hotels: Hotel[] = [];

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(private hotelService: HotelsService) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['city']) {
        this.city = params['city'];
      }
      this.loadHotels();
      this.cdr.markForCheck();
    });
  }

  loadHotels() {
    this.loading = true;

    const params: HotelSearchParams = {
      sortBy: '',
    };

    if (this.city && this.city !== 'All') {
      params.city = this.city; // Makkah | Madinah
    }

    switch (this.sortBy) {
      case 'distance':
        params.sortBy = 'distance';
        break;
      case 'rating':
        params.sortBy = 'rating';
        break;
      default:
        params.sortBy = '';
        break;
    }



    this.hotelService.getHotels(params).subscribe({
      next: (data) => {
        this.hotels = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.hotels = [];
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  toggleView(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  getImageUrl(hotel: Hotel): string {
    return this.hotelService.getImageUrl(hotel);
  }

  availableRoomsCount(hotel: Hotel): number {
    if (!hotel || !hotel.rooms) return 0;
    let total = 0;
    for (const r of hotel.rooms) {
      const any = (r as any).availableRooms;
      if (typeof any === 'number') {
        total += any;
      } else {
        total += r.isActive ? 1 : 0;
      }
    }
    return total;
  }

  // 👇 سيبنا search بالاسم فقط
  filteredHotels() {
    let filtered = this.hotels;

    if (this.searchText) {
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter((hotel) =>
        hotel.name.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  onFilterChange() {
    this.loadHotels();
  }

  getStarArray(rating: number) {
    const maxStars = 5;
    return {
      full: Array(rating).fill(0),
      empty: Array(maxStars - rating).fill(0),
    };
  }

  viewDetails(hotelId: number) {
    this.router.navigate(['/hotels', hotelId]).catch(() => { });
  }
}
