import { Component, Input, OnInit } from '@angular/core';
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
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
// import { ReactiveFormsModule } from '@angular/forms'

@Component({
  selector: 'app-booking-international-transport',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-international-transport.component.html',
  styleUrls: ['./booking-international-transport.component.css'],
})
export class BookingInternationalTransportComponent implements OnInit {
  @Input() selectedDepartureFlight!: TransportOption;

  bookingForm!: FormGroup;

  departureTotal = 0;
  returnTotal = 0;
  totalBookingPrice = 0;

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingInternationalTransportService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const nav = history.state;
    this.selectedDepartureFlight = nav.selectedFlight;
    if (!this.selectedDepartureFlight) {
      console.error('No flight selected!');
      return;
    }
    console.log('Selected Flight:', this.selectedDepartureFlight);

    const departureDateObj = new Date(
      this.selectedDepartureFlight.departureDate
    );
    const arrivalDateObj = new Date(this.selectedDepartureFlight.arrivalDate);
    const returnDateObj = this.selectedDepartureFlight.returnDate
      ? new Date(this.selectedDepartureFlight.returnDate)
      : undefined;

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
    //console.log(this.bookingForm.status); // INVALID or VALID
    // console.log(this.bookingForm.errors); // any top-level errors
    // console.log(this.bookingForm.get('departureBooking.transportId')?.errors);
    // console.log(this.bookingForm.get('departureBooking.numberOfSeats')?.errors);
    this.calculateTotals();
  }

  calculateTotals() {
    const seats =
      this.bookingForm.get('departureBooking.numberOfSeats')?.value || 1;
    this.departureTotal = seats * this.selectedDepartureFlight.price;
    this.returnTotal = seats * this.selectedDepartureFlight.price;
    this.totalBookingPrice = this.departureTotal + this.returnTotal;
  }

  submitBooking() {
    console.log('Booking Form Values:');
    if (this.bookingForm.invalid) {
      console.log('Form is invalid');
      return;
    }

    const seats =
      this.bookingForm.get('departureBooking.numberOfSeats')?.value || 1;
    //  CarrierName: this.selectedDepartureFlight.carrierName,
    //   FlightNumber: this.selectedDepartureFlight.flightNumber,
    //   DepartureAirport: this.selectedDepartureFlight.departureAirport,
    //   ArrivalAirport: this.selectedDepartureFlight.arrivalAirport,
    //   DepartureDate: new Date(this.selectedDepartureFlight.departureDate),

    // CarrierName: this.selectedDepartureFlight.carrierName,
    //   FlightNumber: this.selectedDepartureFlight.flightNumber,
    //   DepartureAirport: this.selectedDepartureFlight.arrivalAirport,
    //   ArrivalAirport: this.selectedDepartureFlight.departureAirport,
    //   DepartureDate: new Date(this.selectedDepartureFlight.returnDate!),

    const depBooking: BookingInternationalTransport = {
      TransportId: +this.selectedDepartureFlight.id!,
      NumberOfSeats: seats,

      PricePerSeat: this.selectedDepartureFlight.price,
      TotalPrice: this.departureTotal,
    };
    console.log('Departure Booking DTO:', depBooking);

    const retBooking: BookingInternationalTransport = {
      TransportId: +this.selectedDepartureFlight.id!,
      NumberOfSeats: seats,

      PricePerSeat: this.selectedDepartureFlight.price,
      TotalPrice: this.returnTotal,
    };
    console.log('Return Booking DTO:', retBooking);

    this.bookingService.bookTransport(depBooking).subscribe({
      next: (response) => {
        console.log(response);
        this.bookingService.bookTransport(retBooking).subscribe({
          //next: () => alert('Round-trip booked successfully!'),
          next: () => {
            this.toastr.success(
              'Round-trip booked successfully!',
              'Booking Confirmed'
            );
          },
          // error: (err) => alert('Return flight booking failed: ' + err.message),
        });
      },
      error: (err) => {
        const backendMessage = err?.error?.message ?? 'Something went wrong';
        this.toastr.error(backendMessage, 'Booking Failed');
        console.error('Booking failed:', backendMessage);
        //console.log('Error booking departure flight:', err.message);
        //alert('Departure flight booking failed: ' + err.message);
      },
    });
  }
}
