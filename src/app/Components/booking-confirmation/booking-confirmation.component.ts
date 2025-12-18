import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingsService } from '../../core/services/bookings.service';
import { BookingDto } from '../../models/api/booking.models';
import { AuthService } from '../../core/services/auth.service';

import { NotificationService } from 'src/app/core/services/notification.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-confirmation.component.html',
  styles: [`
    @media print {
      :host {
        display: block;
        background: white;
      }
      * {
        color: black !important;
        -webkit-print-color-adjust: exact;
      }
    }
    /* Force black text in receipt container always */
    #receipt-container {
        background-color: white !important; /* Ensure content is readable if we force black text */
    }
    #receipt-container * {
      color: black !important;
    }
    #receipt-container .text-white {
        color: white !important; /* Exception for header background text if needed, or invert it */
    }
    /* Actually user wants ALL text black. But header has dark background. 
       Let's stick to black for body, maybe white for header? 
       User said: "Make All Recipt Text color black... For print be better" 
       If I set * color black !important, header text (white on blue) becomes black on blue (hard to read).
       I should target print specifically or use a class toggle.
       Let's use a specific overrides only for text elements inside white areas.
    */
    #receipt-container .text-gray-900, 
    #receipt-container .dark\\:text-white,
    #receipt-container .text-gray-500,
    #receipt-container .text-gray-400
    {
        color: black !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingConfirmationComponent implements OnInit {
  bookingId: string | null = null;
  paymentIntentId: string | null = null;
  booking: BookingDto | null = null;
  isLoading = true;

  currentUser: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingsService: BookingsService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to get current user (it's an Observable, not a sync method)
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.cdr.markForCheck();
      },
      error: (err) => {
        // Silent error
        this.cdr.markForCheck();
      }
    });

    this.bookingId = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('bookingId');
    this.paymentIntentId = this.route.snapshot.queryParamMap.get('paymentIntentId');

    if (this.bookingId) {
      this.fetchBookingDetails(this.bookingId);
    } else {
      this.isLoading = false;
    }
  }

  fetchBookingDetails(id: string | number) {
    this.isLoading = true;
    this.bookingsService.getBookingById(String(id)).subscribe({
      next: (response) => {

        this.booking = this.mapUiProperties(response);

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching booking details:', err);
        this.notificationService.error('Failed to load booking details');
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private mapUiProperties(booking: any): BookingDto {
    if (!booking) return booking;

    const mapped = { ...booking };

    // Helper to find hotel in collection if not at root
    if (!mapped.makkahHotelId && booking.hotels && Array.isArray(booking.hotels)) {
        // Assuming HotelCity enum: 0=Makkah, 1=Madinah (or check string names)
        const makkah = booking.hotels.find((h: any) => h.hotelCity === 0 || h.hotelCity === 'Makkah' || h.hotel?.city === 'Makkah');
        if (makkah) {
            mapped.makkahHotelId = makkah.hotelId;
            mapped.makkahHotel = makkah.hotel; // Flatten for UI
            // Ensure UI sub-properties exist
            if (!mapped.makkahHotel.checkInDate) mapped.makkahHotel.checkInDate = makkah.checkInDate;
            if (!mapped.makkahHotel.checkOutDate) mapped.makkahHotel.checkOutDate = makkah.checkOutDate;
            if (!mapped.makkahHotel.numberOfRooms) mapped.makkahHotel.numberOfRooms = makkah.rooms?.length || makkah.roomCount;
            mapped.makkahHotelPrice = makkah.totalPrice;
        }
    }

    if (!mapped.madinahHotelId && booking.hotels && Array.isArray(booking.hotels)) {
        const madinah = booking.hotels.find((h: any) => h.hotelCity === 1 || h.hotelCity === 'Madinah' || h.hotel?.city === 'Madinah');
        if (madinah) {
            mapped.madinahHotelId = madinah.hotelId;
            mapped.madinahHotel = madinah.hotel;
             if (!mapped.madinahHotel.checkInDate) mapped.madinahHotel.checkInDate = madinah.checkInDate;
            if (!mapped.madinahHotel.checkOutDate) mapped.madinahHotel.checkOutDate = madinah.checkOutDate;
            if (!mapped.madinahHotel.numberOfRooms) mapped.madinahHotel.numberOfRooms = madinah.rooms?.length || madinah.roomCount;
            mapped.madinahHotelPrice = madinah.totalPrice;
        }
    }
    
    // Fallback for existing props logic if above didn't overwrite or was already partial
    if (!mapped.makkahHotelId) mapped.makkahHotelId = booking.makkahHotel?.hotelId;
    if (!mapped.makkahHotelPrice) mapped.makkahHotelPrice = booking.makkahHotel?.totalPrice;
    
    if (!mapped.madinahHotelId) mapped.madinahHotelId = booking.madinahHotel?.hotelId;
    if (!mapped.madinahHotelPrice) mapped.madinahHotelPrice = booking.madinahHotel?.totalPrice;

    // Transport (International)
    if (!mapped.internationalTransportId) {
        // Try collection
        if (booking.bookingInternationalTransport && Array.isArray(booking.bookingInternationalTransport) && booking.bookingInternationalTransport.length > 0) {
            const bit = booking.bookingInternationalTransport[0];
            mapped.internationalTransportId = bit.transportId;
            mapped.internationalTransport = bit.internationalTransport || bit.transport;
            mapped.internationalTransportPrice = bit.totalPrice;
             // Ensure sub-props
            if (mapped.internationalTransport && !mapped.internationalTransport.departureDate) {
                 mapped.internationalTransport.departureDate = bit.departureDate || bit.internationalTransport?.departureDate;
            }
        } else {
             // Try flat prop
             mapped.internationalTransportId = booking.internationalTransport?.transportId || booking.internationalTransport?.id;
             mapped.internationalTransportPrice = booking.internationalTransport?.totalPrice || booking.internationalTransport?.price;
        }
    }

    // Transport (Ground)
    if (!mapped.groundTransportId) {
         if (booking.bookingGroundTransport && Array.isArray(booking.bookingGroundTransport) && booking.bookingGroundTransport.length > 0) {
            const bgt = booking.bookingGroundTransport[0];
            mapped.groundTransportId = bgt.groundTransportId;
            mapped.groundTransport = bgt.groundTransport;
            mapped.groundTransportPrice = bgt.totalPrice;
             if (mapped.groundTransport && !mapped.groundTransport.serviceDate) {
                mapped.groundTransport.serviceDate = bgt.serviceDate;
            }
         } else {
            mapped.groundTransportId = booking.groundTransport?.groundTransportId || booking.groundTransport?.id;
            mapped.groundTransportPrice = booking.groundTransport?.totalPrice;
         }
    }

    mapped.paymentDate = booking.payment?.paidAt || booking.paymentDate;
    
    return mapped as BookingDto;
  }

  async downloadReceipt() {
    const data = document.getElementById('receipt-container');
    if (data) {
      this.notificationService.info('Generating PDF...', 'Please wait');
      
      try {
        // Use html2canvas to render the element
        const canvas = await html2canvas(data, {
          scale: 2, // Higher scale for better quality
          useCORS: true, // Important for external images
          logging: false
        });

        const imgWidth = 208; // A4 width in mm (approx 210)
        const pageHeight = 295; // A4 height in mm (approx 297)
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const contentDataURL = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Add image to PDF
        pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // Save
        pdf.save(`Manasik_Receipt_${this.booking?.bookingNumber || this.bookingId}.pdf`);
        
        this.notificationService.success('Receipt downloaded successfully');
      } catch (error) {
        console.error('PDF Generation Error:', error);
        this.notificationService.error('Failed to generate PDF. Printing instead.');
        window.print();
      }
    } else {
      window.print();
    }
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
