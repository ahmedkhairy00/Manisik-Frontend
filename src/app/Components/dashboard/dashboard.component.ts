import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { I18nService } from 'src/app/core/services/i18n.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { BookingsService } from 'src/app/core/services/bookings.service';
import { ToastrService } from 'ngx-toastr';
import { BookingDto } from 'src/app/models/api';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { HotelsService } from 'src/app/core/services/hotels.service';

import { 
  LucideAngularModule, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Users, 
  Building2, 
  MapPin, 
  Star, 
  Navigation, 
  Bed, 
  Mail, 
  Plus, 
  Trash2, 
  Edit, 
  Plane, 
  Bus, 
  Building, 
  AlertCircle 
} from 'lucide-angular';

// -----------------------
// DTO / Interface Section
// -----------------------
export interface UserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  country: string;
  roles: string[];
  isActive: boolean;
  fullName: string;
}

export interface AssignRoleDto {
  userId: number;
  roleName: string;
}

export interface HotelDto {
  id?: number;
  name: string;
  description?: string;
  descriptionAr?: string;
  address: string;
  city: string;
  rating?: number;
  pricePerNight: number;
  isActive?: boolean;
}

export interface RoomDto {
  id?: number;
  hotelId?: number;
  roomType: string;
  capacity: number;
  pricePerNight: number;
  totalRooms: number;
  availableRooms: number;
  isActive: boolean;
}

export interface HotelDto {
  id?: number;
  name: string;
  description?: string;
  descriptionAr?: string;
  address: string;
  city: string;
  rating?: number;
  pricePerNight: number;
  availableRooms: number;
  amenities?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
  userId?: number;
  starRating?: number;
  distanceToHaram?: number;
  imageUrl?: string;
  rooms?: RoomDto[];
}

export interface InternationalTransportDto {
  id?: number;
  internationalTransportType: string;
  carrierName: string;
  departureAirport: string;
  departureAirportCode?: string;
  arrivalAirport: string;
  arrivalAirportCode?: string;
  departureDate: string;
  arrivalDate: string;
  price: number;
  totalSeats?: number;
  availableSeats: number;
  flightNumber?: string;
  isActive?: boolean;
  createdAt?: string;
  createdByUserId?: number;
}

export interface GroundTransportDto {
  id?: number;
  serviceName: string;
  serviceNameAr?: string;
  type: string; // 'PrivateCar', 'SharedBus', 'Taxi'
  pricePerPerson: number;
  description?: string;
  descriptionAr?: string;
  capacity: number;
  isActive?: boolean;
  createdAt?: string;
}

// -----------------------
// Dashboard Component
// -----------------------
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LucideAngularModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // ----- Injected services -----
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);
  readonly bookings = inject(BookingsService);
  readonly toastr = inject(ToastrService);
  readonly http = inject(HttpClient);
  readonly router = inject(Router);
  readonly hotels = inject(HotelsService);

  // ----- Initial model defaults -----
  hotel: HotelDto = {
    name: '',
    description: '',
    address: '',
    city: 'Makkah',
    rating: 3,
    pricePerNight: 0,
    availableRooms: 0,
    amenities: '',
    latitude: 0,
    longitude: 0,
    isActive: true,
    userId: 0,
    starRating: 3,
    distanceToHaram: 0,
    imageUrl: ''
  };

  // ----- Signals / State -----
  currentUser = signal<any>(null);
  role = signal<string | null>(null);
  activeView = signal<'overview' | 'bookings' | 'users' | 'hotels' | 'international-transport' | 'ground-transport'>('overview');

  loading = signal<boolean>(false);
  usersLoading = signal<boolean>(false);
  bookingsLoading = signal<boolean>(false);

  allBookings = signal<BookingDto[]>([]);
  myBookings = signal<BookingDto[]>([]);
  allUsers = signal<UserDto[]>([]);
  usersByRole = signal<UserDto[]>([]);

  bookingStatusFilter = signal<string>('all');
  userRoleFilter = signal<string>('all');
  searchQuery = signal<string>('');

  selectedUser = signal<UserDto | null>(null);
  roleToAssign = signal<string>('User');
  showRoleModal = signal<boolean>(false);

  // Hotel management
  allHotels = signal<HotelDto[]>([]);
  myHotels = signal<HotelDto[]>([]);
  hotelsLoading = signal<boolean>(false);
  selectedHotel = signal<HotelDto | null>(null);
  showHotelModal = signal<boolean>(false);

  // User menu state
  showUserMenu = signal<boolean>(false);

  // Form backing objects (plain objects to work with ngModel)
  hotelFormData: HotelDto = {
    name: '',
    address: '',
    city: 'Makkah',
    pricePerNight: 0,
    availableRooms: 0,
    starRating: 3,
    distanceToHaram: 0,
    description: '',
    descriptionAr: '',
    amenities: ''
  } as HotelDto;
  selectedFile: File | null = null;

  // International transport
  allInternationalTransports = signal<InternationalTransportDto[]>([]);
  internationalTransportsLoading = signal<boolean>(false);
  selectedInternationalTransport = signal<InternationalTransportDto | null>(null);
  showInternationalTransportModal = signal<boolean>(false);

  internationalTransportFormData: InternationalTransportDto = {
    carrierName: '',
    internationalTransportType: 'Flight',
    departureAirport: '',
    departureAirportCode: '',
    arrivalAirport: '',
    arrivalAirportCode: '',
    departureDate: '',
    arrivalDate: '',
    price: 0,
    totalSeats: 0,
    availableSeats: 0,
    flightNumber: '',
    isActive: true
  } as InternationalTransportDto;

  // Ground transport
  allGroundTransports = signal<GroundTransportDto[]>([]);
  groundTransportsLoading = signal<boolean>(false);
  selectedGroundTransport = signal<GroundTransportDto | null>(null);
  showGroundTransportModal = signal<boolean>(false);

  groundTransportFormData: GroundTransportDto = {
    serviceName: '',
    serviceNameAr: '',
    type: 'PrivateCar',
    pricePerPerson: 0,
    description: '',
    descriptionAr: '',
    capacity: 0,
    isActive: true
  } as GroundTransportDto;

  // ----- Computed properties -----
  stats = computed(() => {
    const bookings = this.role() === 'Admin' ? this.allBookings() : this.myBookings();
    const confirmed = bookings.filter(b => b.status === 'Confirmed').length;
    const pending = bookings.filter(b => b.status === 'Pending').length;
    const cancelled = bookings.filter(b => b.status === 'Cancelled').length;

    return {
      total: bookings.length,
      confirmed,
      pending,
      cancelled,
      users: this.allUsers().length,
      hotels: this.allHotels().length,
      internationalTransports: this.allInternationalTransports().length,
      groundTransports: this.allGroundTransports().length
    };
  });

  upcomingTrips = computed(() => {
    const bookings = this.role() === 'Admin' ? this.allBookings() : this.myBookings();
    const upcoming = bookings
      .filter(b => b.status === 'Confirmed')
      .map(b => ({
        type: this.getBookingType(b),
        destination: 'Makkah & Madinah',
        hotel: 'N/A',
        status: b.status || 'Unknown',
        daysLeft: this.calculateDaysLeft(b.createdAt)
      }));
    return upcoming.slice(0, 3);
  });

  recentActivity = computed(() => {
    const bookings = this.role() === 'Admin' ? this.allBookings() : this.myBookings();
    return bookings.slice(0, 5).map(b => ({
      action: b.status === 'Confirmed' ? 'Confirmed' : b.status === 'Pending' ? 'Pending' : 'Cancelled',
      item: `Booking #${b.id}`,
      time: this.getTimeAgo(b.createdAt)
    }));
  });

  filteredBookings = computed(() => {
    let bookings = this.role() === 'Admin' ? this.allBookings() : this.myBookings();

    if (this.bookingStatusFilter() !== 'all') {
      bookings = bookings.filter(b => b.status === this.bookingStatusFilter());
    }

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      bookings = bookings.filter(b => 
        b.id?.toString().includes(query) ||
        b.status?.toLowerCase().includes(query)
      );
    }

    return bookings;
  });

  filteredUsers = computed(() => {
    let users = this.allUsers();

    if (this.userRoleFilter() !== 'all') {
      users = users.filter(u => u.roles.includes(this.userRoleFilter()));
    }

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      users = users.filter(u => 
        u.email.toLowerCase().includes(query) ||
        u.fullName.toLowerCase().includes(query)
      );
    }

    return users;
  });

  displayedHotels = computed(() => this.role() === 'HotelManager' ? this.myHotels() : this.allHotels());

  // ----- Lifecycle -----
  ngOnInit() {
    this.auth.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      const userRole = user?.roles?.[0] ?? null;
      this.role.set(userRole);

      if (user) {
        this.loadDashboardData();
      }
    });
  }

  // ----- Data loading orchestration -----
  private loadDashboardData() {
    const userRole = this.role();

    if (userRole === 'User') {
      this.loadMyBookings();
    } else if (userRole === 'Admin') {
      this.loadAllBookings();
      this.loadAllUsers();
      this.loadHotels();
      this.loadInternationalTransports();
      this.loadGroundTransports();
    } else if (userRole === 'HotelManager') {
      this.loadMyBookings();
      this.loadHotels();
    }
  }

  // ----- Bookings -----
  loadMyBookings() {
    this.bookingsLoading.set(true);
    this.bookings.getMyBookingsWithCache().subscribe({
      next: (bookings) => {
        this.myBookings.set(bookings);
        this.bookingsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load bookings', err);
        this.toastr.error('Failed to load bookings');
        this.bookingsLoading.set(false);
      }
    });
  }

  updateBookingStatus(id: number , status: string): void {
  this.bookings.updateStatus(String(id), status).subscribe({
    next: () => {
      this.loadAllBookings(); // reload list after update
    },
    error: err => {
      console.error('Failed to update booking status', err);
    }
  });
}

deleteHotel(id: number): void {
  this.hotels.deleteHotel(String(id)).subscribe({
    next: () => this.loadHotels(),
    error: err => console.error(err)
  });
}


  loadAllBookings() {
    this.bookingsLoading.set(true);
    this.bookings.getAllBookings().subscribe({
      next: (bookings) => {
        this.allBookings.set(bookings);
        this.bookingsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load all bookings', err);
        this.toastr.error('Failed to load all bookings');
        this.bookingsLoading.set(false);
      }
    });
  }

  cancelBooking(booking: BookingDto) {
    // Keep original business rules while making code clearer
    if (booking.status === 'Cancelled') {
      this.toastr.error('Booking already cancelled');
      return;
    }

    // Only enforce 7-day limit for Users; Admin can cancel anytime
    if (this.role() === 'User') {
      const createdDate = new Date(booking.createdAt || '');
      const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceCreation > 7) {
        this.toastr.error('Cannot cancel booking after 7 days');
        return;
      }
    }

    if (!confirm(this.i18n.t('dashboard.confirmCancel'))) return;

    this.bookings.cancelBooking(String(booking.id)).subscribe({
      next: () => {
        this.toastr.success('Booking cancelled successfully');
        if (this.role() === 'Admin') {
          this.loadAllBookings();
        } else {
          this.loadMyBookings();
        }
      },
      error: (err) => {
        console.error('Failed to cancel booking', err);
        const serverMessage = err?.error?.message || 'Failed to cancel booking';
        this.toastr.error(serverMessage);
      }
    });
  }

  // ----- Users -----
  loadAllUsers() {
    this.usersLoading.set(true);
    this.http.get<{ data: UserDto[] }>(`${environment.apiUrl}/Auth/Users`, { withCredentials: true }).subscribe({
      next: (response) => {
        this.allUsers.set(response.data);
        this.usersLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.toastr.error('Failed to load users');
        this.usersLoading.set(false);
      }
    });
  }

  loadUsersByRole(role: string) {
    this.usersLoading.set(true);
    this.http.get<{ data: UserDto[] }>(`${environment.apiUrl}/Auth/UsersByRole/${role}`, { withCredentials: true }).subscribe({
      next: (response) => {
        this.usersByRole.set(response.data);
        this.usersLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users by role', err);
        this.toastr.error('Failed to load users by role');
        this.usersLoading.set(false);
      }
    });
  }

  openRoleModal(user: UserDto) {
    this.selectedUser.set(user);
    this.roleToAssign.set('User');
    this.showRoleModal.set(true);
  }

  assignRole() {
    const user = this.selectedUser();
    if (!user) return;

    const payload: AssignRoleDto = {
      userId: user.id,
      roleName: this.roleToAssign()
    };

    this.http.post(`${environment.apiUrl}/Auth/AssignRole`, payload, { withCredentials: true }).subscribe({
      next: () => {
        this.toastr.success('Role assigned successfully');
        this.showRoleModal.set(false);
        this.loadAllUsers();
      },
      error: (err: any) => {
        console.error('Failed to assign role', err);
        this.toastr.error('Failed to assign role');
      }
    });
  }

  removeRole(user: UserDto, role: string) {
    if (!confirm(`Remove ${role} role from ${user.fullName}?`)) return;

    const payload: AssignRoleDto = {
      userId: user.id,
      roleName: role
    };

    this.http.post(`${environment.apiUrl}/Auth/RemoveRole`, payload, { withCredentials: true }).subscribe({
      next: () => {
        this.toastr.success('Role removed successfully');
        this.loadAllUsers();
      },
      error: (err: any) => {
        console.error('Failed to remove role', err);
        this.toastr.error('Failed to remove role');
      }
    });
  }

  // ----- View helpers -----
  setActiveView(view: 'overview' | 'bookings' | 'users' | 'hotels' | 'international-transport' | 'ground-transport') {
    this.activeView.set(view);
    this.searchQuery.set('');

    if (view === 'bookings' && this.role() === 'Admin' && this.allBookings().length === 0) {
      this.loadAllBookings();
    }
    if (view === 'users' && this.allUsers().length === 0) {
      this.loadAllUsers();
    }
    if (view === 'hotels') {
      if (this.role() === 'Admin' && this.allHotels().length === 0) {
        this.loadHotels();
      } else if (this.role() === 'HotelManager' && this.myHotels().length === 0) {
        this.loadHotels();
      }
    }
    if (view === 'international-transport' && this.role() === 'Admin' && this.allInternationalTransports().length === 0) {
      this.loadInternationalTransports();
    }
    if (view === 'ground-transport' && this.role() === 'Admin' && this.allGroundTransports().length === 0) {
      this.loadGroundTransports();
    }
  }

  updateSearchQuery(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  updateUserRoleFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.userRoleFilter.set(value);
  }

  updateBookingStatusFilter(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.bookingStatusFilter.set(value);
  }

  updateRoleToAssign(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.roleToAssign.set(value);
  }

  // ----- Booking helpers -----
  canCancelBooking(booking: BookingDto): boolean {
    if (booking.status === 'Cancelled') return false;
    if (this.role() === 'Admin') return true;
    if (this.role() === 'User') {
      const createdDate = new Date(booking.createdAt || '');
      const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCreation <= 7;
    }
    return false;
  }

  getDaysSinceCreation(booking: BookingDto): number {
    const createdDate = new Date(booking.createdAt || '');
    return Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  formatDate(dateStr?: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  }

  getBookingType(booking: BookingDto): string {
    return booking.type || 'Package';
  }

  calculateDaysLeft(createdAt?: string | null): number {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const tripDate = new Date(created);
    tripDate.setDate(tripDate.getDate() + 30); // Assume trip is 30 days after booking
    const today = new Date();
    const diff = tripDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  getTimeAgo(dateStr?: string | null): string {
    if (!dateStr) return 'recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }

  // ----- Auth / header helpers -----
  logout() {
    this.showUserMenu.set(false);
    this.auth.logout().subscribe({
      next: () => {
        this.toastr.success('Logged out successfully');
      },
      error: (err) => {
        console.error('Logout failed:', err);
        this.toastr.error('Logout failed');
      }
    });
  }

  toggleUserMenu() {
    this.showUserMenu.update(v => !v);
  }

  closeUserMenu() {
    this.showUserMenu.set(false);
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    const first = (user.firstName || '').trim();
    const last = (user.lastName || '').trim();
    const a = first ? first.charAt(0) : (user.fullName ? user.fullName.charAt(0) : 'U');
    const b = last ? last.charAt(0) : '';
    return (a + b).toUpperCase();
  }

  getUserName(userId?: number | null): string {
    if (!userId) return 'Unknown User';
    const user = this.allUsers().find(u => u.id === userId);
    return user ? (user.fullName || `${user.firstName} ${user.lastName}`) : `User #${userId}`;
  }

  getBookingNumber(booking: BookingDto): string {
    return booking.bookingNumber ? booking.bookingNumber : `#${booking.id}`;
  }

  private formatForInput(dateStr?: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  }

  currentUserName(): string {
    const user = this.currentUser();
    if (!user) return '';
    return user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  currentUserPhone(): string {
    const user = this.currentUser();
    if (!user) return '';
    return user.phoneNumber || user.phone || '—';
  }

  goToProfile() {
    this.closeUserMenu();
    try {
      this.router.navigate(['/profile']);
    } catch (e) {
      console.warn('Profile route not available');
    }
  }

  // ----- Hotel management -----
  loadHotels() {
    this.hotelsLoading.set(true);
    const url = this.role() === 'HotelManager'
      ? `${environment.apiUrl}/Hotel/GetMyHotels`
      : `${environment.apiUrl}/Hotel/GetAllFiltered`;

    this.http.get<{ data: HotelDto[] }>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        if (this.role() === 'HotelManager') {
          this.myHotels.set(response.data);
        } else {
          this.allHotels.set(response.data);
        }
        this.hotelsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load hotels', err);
        this.toastr.error('Failed to load hotels');
        this.hotelsLoading.set(false);
      }
    });
  }

  openHotelModal(hotel?: HotelDto) {
    this.selectedFile = null;
    if (hotel) {
      this.hotelFormData = JSON.parse(JSON.stringify(hotel)); // Deep copy
      if (!this.hotelFormData.rooms) this.hotelFormData.rooms = [];
      this.selectedHotel.set(hotel);
    } else {
      this.hotelFormData = {
        name: '',
        address: '',
        city: 'Makkah',
        pricePerNight: 0,
        availableRooms: 0,
        starRating: 3,
        distanceToHaram: 0,
        description: '',
        descriptionAr: '',
        amenities: '',
        rooms: []
      } as HotelDto;
      this.selectedHotel.set(null);
    }
    this.showHotelModal.set(true);
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] ?? null;
  }

  saveHotel() {
    const hotelData = this.hotelFormData as HotelDto;
    
    // Frontend validation
    if (!hotelData.name?.trim()) {
      this.toastr.error('Hotel name is required');
      return;
    }
    if (!hotelData.address?.trim()) {
      this.toastr.error('Address is required');
      return;
    }
    if (hotelData.rooms && hotelData.rooms.length > 0) {
      for (let i = 0; i < hotelData.rooms.length; i++) {
        const room = hotelData.rooms[i];
        if (!room.roomType) {
          this.toastr.error(`Room ${i + 1}: Type is required`);
          return;
        }
        if (!room.pricePerNight || room.pricePerNight < 1) {
          this.toastr.error(`Room ${i + 1}: Price must be greater than 0`);
          return;
        }
        if (!room.capacity || room.capacity < 1) {
          this.toastr.error(`Room ${i + 1}: Capacity must be at least 1`);
          return;
        }
      }
    }
    
    const isEdit = !!this.selectedHotel();
    const url = isEdit 
      ? `${environment.apiUrl}/Hotel/UpdateHotel/${hotelData.id}`
      : `${environment.apiUrl}/Hotel/CreateHotel`;

    const formData = new FormData();

    formData.append('Name', hotelData.name || '');
    formData.append('City', hotelData.city || 'Makkah');
    formData.append('Address', hotelData.address || '');
    formData.append('StarRating', String(hotelData.starRating || 3));
    formData.append('DistanceToHaram', String(hotelData.distanceToHaram || 0));
    formData.append('Description', hotelData.description || '');
    formData.append('DescriptionAr', hotelData.descriptionAr || '');
    formData.append('IsActive', 'true');

    // Append Rooms (indexed for MVC binding)
    if (hotelData.rooms && hotelData.rooms.length > 0) {
      hotelData.rooms.forEach((room, index) => {
        if (room.id) formData.append(`Rooms[${index}].Id`, room.id.toString());
        formData.append(`Rooms[${index}].RoomType`, room.roomType);
        formData.append(`Rooms[${index}].Capacity`, room.capacity.toString());
        formData.append(`Rooms[${index}].PricePerNight`, room.pricePerNight.toString());
        formData.append(`Rooms[${index}].TotalRooms`, room.totalRooms.toString());
        formData.append(`Rooms[${index}].AvailableRooms`, room.availableRooms.toString());
        formData.append(`Rooms[${index}].IsActive`, room.isActive.toString());
      });
    } else {
        // Fallback for creating a default room if none added specifically (legacy support)
        // OR we can force user to add a room. For now, let's keep the manual simple fallback if empty
        // But better to let the UI drive this. Removing the hardcoded default room logic from previous version.
    }

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    } else if (isEdit && hotelData.imageUrl) {
      formData.append('ImageUrl', hotelData.imageUrl);
    }

    const request = isEdit 
      ? this.http.put(url, formData, { withCredentials: true })
      : this.http.post(url, formData, { withCredentials: true });

    request.subscribe({
      next: (resp: any) => {
        console.log('Save hotel response', resp);
        this.toastr.success(isEdit ? 'Hotel updated successfully' : 'Hotel created successfully');
        this.showHotelModal.set(false);
        this.loadHotels();
      },
      error: (err: any) => {
        console.error('Failed to save hotel', err);
        const serverMessage = err?.error?.message || err?.error?.errors?.join(', ') || err?.message || 'Failed to save hotel';
        this.toastr.error(serverMessage);
      }
    });
  }

  addRoom() {
    if (!this.hotelFormData.rooms) {
      this.hotelFormData.rooms = [];
    }
    this.hotelFormData.rooms.push({
      roomType: 'Single',
      capacity: 2,
      pricePerNight: 0,
      totalRooms: 1,
      availableRooms: 1,
      isActive: true
    });
  }

  removeRoom(index: number) {
    if (this.hotelFormData.rooms) {
      this.hotelFormData.rooms.splice(index, 1);
    }
  }

  viewHotelDetails(hotel: HotelDto) {
    if (!hotel || !hotel.id) return;
    this.router.navigate(['/hotels', hotel.id]);
  }

  getHotelImage(hotel: HotelDto): string {
    if (!hotel.imageUrl) return 'assets/images/hotel-placeholder.jpg';
    if (hotel.imageUrl.startsWith('http')) return hotel.imageUrl;
    return `${environment.apiUrlForImages}${hotel.imageUrl}`;
  }

  handleImageError(event: any) {
    event.target.src = 'assets/images/hotel-placeholder.jpg';
  }

  // ----- International transport -----
  loadInternationalTransports() {
    this.internationalTransportsLoading.set(true);
    this.http.get<{ data: InternationalTransportDto[] }>(`${environment.apiUrl}/InternationalTransport/GetAllTransports`, { withCredentials: true }).subscribe({
      next: (response) => {
        this.allInternationalTransports.set(response.data);
        this.internationalTransportsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load international transports', err);
        this.toastr.error('Failed to load international transports');
        this.internationalTransportsLoading.set(false);
      }
    });
  }

  openInternationalTransportModal(transport?: InternationalTransportDto) {
    if (transport) {
      this.internationalTransportFormData = { 
        ...transport,
        departureDate: this.formatForInput(transport.departureDate),
        arrivalDate: this.formatForInput(transport.arrivalDate)
      } as InternationalTransportDto;
      this.selectedInternationalTransport.set(transport);
    } else {
      this.internationalTransportFormData = {
        carrierName: '',
        internationalTransportType: 'Plane',
        departureAirport: '',
        departureAirportCode: '',
        arrivalAirport: '',
        arrivalAirportCode: '',
        departureDate: '',
        arrivalDate: '',
        price: 0,
        totalSeats: 0,
        availableSeats: 0,
        flightNumber: '',
        isActive: true
      } as InternationalTransportDto;
      this.selectedInternationalTransport.set(null);
    }
    this.showInternationalTransportModal.set(true);
  }

  saveInternationalTransport() {
    const transportData = this.internationalTransportFormData;
    const isEdit = !!this.selectedInternationalTransport();
    const url = isEdit 
      ? `${environment.apiUrl}/InternationalTransport/UpdateTransport/${transportData.id}`
      : `${environment.apiUrl}/InternationalTransport/CreateTransport`;

    const request = isEdit 
      ? this.http.put(url, transportData, { withCredentials: true })
      : this.http.post(url, transportData, { withCredentials: true });

    request.subscribe({
      next: () => {
        this.toastr.success(isEdit ? 'Transport updated successfully' : 'Transport created successfully');
        this.showInternationalTransportModal.set(false);
        this.loadInternationalTransports();
      },
      error: (err: any) => {
        console.error('Failed to save transport', err);
        this.toastr.error('Failed to save transport');
      }
    });
  }

  deleteInternationalTransport(id: number) {
    if (!confirm(this.i18n.t('dashboard.confirmDelete'))) return;

    this.http.delete(`${environment.apiUrl}/InternationalTransport/DeleteTransport/${id}`, { withCredentials: true }).subscribe({
      next: () => {
        this.toastr.success('Transport deleted successfully');
        this.loadInternationalTransports();
      },
      error: (err) => {
        console.error('Failed to delete transport', err);
        this.toastr.error('Failed to delete transport');
      }
    });
  }

  // ----- Ground transport -----
  loadGroundTransports() {
    this.groundTransportsLoading.set(true);
    this.http.get<{ data: GroundTransportDto[] }>(`${environment.apiUrl}/GroundTransport/GetAllGroundTransports`, { withCredentials: true }).subscribe({
      next: (response) => {
        this.allGroundTransports.set(response.data);
        this.groundTransportsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load ground transports', err);
        this.toastr.error('Failed to load ground transports');
        this.groundTransportsLoading.set(false);
      }
    });
  }

  openGroundTransportModal(transport?: GroundTransportDto) {
    if (transport) {
      this.groundTransportFormData = { ...transport } as GroundTransportDto;
      this.selectedGroundTransport.set(transport);
    } else {
      this.groundTransportFormData = {
        serviceName: '',
        serviceNameAr: '',
        type: 'PrivateCar',
        pricePerPerson: 0,
        description: '',
        descriptionAr: '',
        capacity: 0,
        isActive: true
      } as GroundTransportDto;
      this.selectedGroundTransport.set(null);
    }
    this.showGroundTransportModal.set(true);
  }

  saveGroundTransport() {
    const transportData = this.groundTransportFormData;
    const isEdit = !!this.selectedGroundTransport();
    const url = isEdit 
      ? `${environment.apiUrl}/GroundTransport/UpdateGroundTransport/${transportData.id}`
      : `${environment.apiUrl}/GroundTransport/CreateGroundTransport`;

    const request = isEdit 
      ? this.http.put(url, transportData, { withCredentials: true })
      : this.http.post(url, transportData, { withCredentials: true });

    request.subscribe({
      next: () => {
        this.toastr.success(isEdit ? 'Transport updated successfully' : 'Transport created successfully');
        this.showGroundTransportModal.set(false);
        this.loadGroundTransports();
      },
      error: (err: any) => {
        console.error('Failed to save transport', err);
        this.toastr.error('Failed to save transport');
      }
    });
  }

  deleteGroundTransport(id: number) {
    if (!confirm(this.i18n.t('dashboard.confirmDelete'))) return;

    this.http.delete(`${environment.apiUrl}/GroundTransport/DeleteGroundTransport/${id}`, { withCredentials: true }).subscribe({
      next: () => {
        this.toastr.success('Transport deleted successfully');
        this.loadGroundTransports();
      },
      error: (err) => {
        console.error('Failed to delete transport', err);
        this.toastr.error('Failed to delete transport');
      }
    });
  }

  getTransportTypeName(type: string | number, isInternational: boolean): string {
    if (isInternational) {
      return String(type);
    } else {
      // Handle both string (backend) and legacy number cases
      if (type === 'PrivateCar' || type === 0) return 'Private Car';
      if (type === 'SharedBus' || type === 1) return 'Shared Bus';
      if (type === 'Taxi' || type === 2) return 'Taxi';
      return String(type);
    }
  }

  // ----- UI labels / i18n -----
  getBookingViewTitle(): string {
    return this.role() === 'Admin' ? this.i18n.t('dashboard.menu.dashboard') : this.i18n.t('dashboard.menu.myBookings');
  }

  getWelcomeMessage(): string {
    const role = this.role();
    if (role === 'Admin') return this.i18n.t('dashboard.welcome.admin');
    if (role === 'HotelManager') return this.i18n.t('dashboard.welcome.hotelManager');
    return this.i18n.t('dashboard.welcome.user');
  }

  getBookingsMenuLabel(): string {
    return this.role() === 'Admin' ? this.i18n.t('dashboard.menu.dashboard') : this.i18n.t('dashboard.menu.myBookings');
  }
}
