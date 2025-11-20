import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HotelsService } from 'src/app/core/services/hotels.service';
import { I18nService } from 'src/app/core/services/i18n.service';
import { Hotel, HotelSearchParams } from 'src/app/interfaces/hotel.interface';
import { LucideAngularModule } from 'lucide-angular';
import { Router } from '@angular/router';
@Component({
  selector: 'app-hotel',
  imports: [FormsModule, CommonModule, LucideAngularModule],
  templateUrl: './hotel.component.html',
  styleUrl: './hotel.component.css',
})
export class HotelComponent implements OnInit {
  // expose I18nService to template so we can call i18n.translate(...) inside hotel templates
  readonly i18n = inject(I18nService);
  viewMode: 'grid' | 'list' = 'grid';
  searchText: string = '';
  city: string = 'Makkah'; // 0 for Makkah, 1 for Madinah
  sortBy: string = 'recommended'; // default option
  loading = false;

  hotels: Hotel[] = [];
  // Inject HotelsService to fetch data and Router to navigate to details page
  private readonly router = inject(Router);
  constructor(private hotelService: HotelsService) {}

  ngOnInit(): void {
    this.loadHotels();
  }

  loadHotels() {
    this.loading = true;

    const params: HotelSearchParams = {
      city: this.city,
      sortBy: '', // default empty
    };

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

    // Call the service with combined city and sort filter
    this.hotelService.getHotels(params).subscribe({
      next: (data) => {
        this.hotels = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load hotels', err);
        this.hotels = [];
        this.loading = false;
      },
    });
  }

  toggleView(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }
  getImageUrl(hotel: Hotel): string {
    return this.hotelService.getImageUrl(hotel);
  }
  filteredHotels() {
    let filtered = this.hotels;
    // Filter by search text
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

  /**
   * Navigate to the Hotel Details page.
   * We only navigate; the HotelDetailsComponent will fetch the hotel by ID
   * using HotelsService (keeps data fetching single-responsibility).
   */
  viewDetails(hotelId: number) {
    this.router
      .navigate(['/hotels', hotelId])
      .catch((err) => console.error('Navigation error:', err));
  }
}
