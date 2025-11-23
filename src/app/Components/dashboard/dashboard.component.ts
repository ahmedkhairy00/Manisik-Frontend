import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from 'src/app/core/services/i18n.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { FormsModule } from '@angular/forms';

interface Trip {
  id: number;
  type: string;
  destination: string;
  hotel: string;
  date: string;
  daysLeft: number;
  status: string;
}

interface Activity {
  action: string;
  item: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);

  role = signal<string | null>(null);
  currentUser = signal<any>(null);
  upcomingTrips = signal<Trip[]>([]);
  recentActivity = signal<Activity[]>([]);

  manageHotelData = {
    name: '',
    city: 0,
    address: '',
    starRating: 0,
    distanceToHaram: 0,
    description: '',
    descriptionAr: '',
    imageUrl: '',
    rooms: []
  };

  constructor() {
    // React to user changes
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser.set(user);
        this.role.set(user.role);
        this.loadDashboardData(user.role);
      }
    });
  }

  ngOnInit() {
    // Initial load if user is already present
    const user = this.auth.getCurrentUserValue();
    if (user) {
      this.currentUser.set(user);
      this.role.set(user.role);
      this.loadDashboardData(user.role);
    }
  }

  loadDashboardData(role: string) {
    if (role === 'User') {
      this.upcomingTrips.set([
        { id: 1, type: 'Premium Umrah', destination: 'Makkah', hotel: 'Hilton', date: 'Dec 15, 2025', daysLeft: 45, status: 'Confirmed' }
      ]);
      this.recentActivity.set([
        { action: 'Booking confirmed', item: 'Premium Umrah Package', time: '2 hours ago' }
      ]);
    } else if (role === 'Admin') {
      this.recentActivity.set([
        { action: 'New User Registered', item: 'Ahmed Khairy', time: '5 mins ago' },
        { action: 'System Update', item: 'v1.2.0 Deployed', time: '1 day ago' }
      ]);
    } else if (role === 'HotelManager') {
      this.recentActivity.set([
        { action: 'New Booking', item: 'Room 101 - Hilton', time: '10 mins ago' },
        { action: 'Review Received', item: '5 Stars', time: '1 hour ago' }
      ]);
    }
  }

  confirmBooking(id: number) {
    console.log("confirm", id);
  }

  cancelBooking(id: number) {
    console.log("cancel", id);
  }

  refundBooking(id: number) {
    console.log("refund", id);
  }

  addHotel() {
    console.log("Hotel Request:", this.manageHotelData);
  }
}
