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
import { BookingHotelService } from 'src/app/core/services/booking-hotel.service';
import { HotelsService } from 'src/app/core/services/hotels.service';
import { HotelBooking } from 'src/app/interfaces';

@Component({
  selector: 'app-booking-hotel',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './booking-hotel.component.html',
  styleUrl: './booking-hotel.component.css',
})
export class BookingHotelComponent implements OnInit {
  bookingForm!: FormGroup;
  hotelId!: number;
  roomId!: number;
  hotel: any = null;
  room: any = null;
  totalPrice: number = 0;
  existingBookings: HotelBooking[] = [];
  private route = inject(ActivatedRoute);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private bookingService: BookingHotelService,
    private hotelsService: HotelsService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.hotelId = +params['hotelId'];
      this.roomId = +params['roomId'];
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

    // Fetch existing bookings to check for overlapping dates // after user token implemetatiom
    // this.bookingService.getUserHotelBookings().subscribe({
    //   next: (bookings) => (this.existingBookings = bookings),
    // });
  }

  loadHotelDetails() {
    this.hotelsService.getHotelById(this.hotelId).subscribe({
      next: (hotel) => {
        this.hotel = hotel;
        this.room = hotel.rooms.find((r: any) => r.id === this.roomId);
        this.calculateTotalPrice();
      },
      error: (err) => console.error('Failed to load hotel', err),
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

      if (!checkIn || !checkOut) return { invalid: true };

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      // 1. Check order
      if (checkInDate >= checkOutDate) return { dateOrderInvalid: true };

      // // 2. Check overlapping with existing bookings in this city
      // const overlap = this.existingBookings
      //   .filter((b) => b.city === this.hotel?.city)
      //   .some(
      //     (b) =>
      //       checkInDate < new Date(b.checkOutDate) &&
      //       checkOutDate > new Date(b.checkInDate)
      //   );

      // if (overlap) return { overlappingBooking: true };

      return null;
    };
  }

  submitBooking() {
    if (this.bookingForm.invalid) return;

    const { checkInDate, checkOutDate, numberOfRooms } = this.bookingForm.value;
    const bookingDto: HotelBooking = {
      hotelId: this.hotel.id,
      hotelName: this.hotel.name,
      roomId: this.room.id,
      roomType: this.room.roomType,
      city: this.hotel.city,
      checkInDate,
      checkOutDate,
      numberOfRooms,
      numberOfNights: Math.ceil(
        (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      pricePerNight: this.room.pricePerNight,
      totalPrice: this.totalPrice,
    };

    this.bookingService.bookHotel(bookingDto).subscribe({
      next: (res) => {
        //alert('Hotel booked successfully!'); // toaster insted
        console.log('Booking successful');
        this.router.navigate(['/next-step']); // navigate to transport booking or summary**********
      },
      error: (err) => console.error('Booking failed', err),
    });
  }
}
