import { Component } from '@angular/core';

import { MatToolbarModule, MatToolbar } from '@angular/material/toolbar';
import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';






import { FormsModule } from '@angular/forms';


interface Flight {
  airline: string;
  code: string;
  rating: number;
  reviews: number;
  duration: string;
  class: string;
  stops: string;
  price: number;
  meals: string;
  baggage: string;
  amenities: string[];
}

@Component({
  selector: 'app-transport',
  imports: [ MatToolbar, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule],
  templateUrl: './transport.component.html',
  styleUrl: './transport.component.css'
})
export class TransportComponent {
transportType: string = 'air';
  fromCity: string = '';
  toCity: string = 'Jeddah';
  departureDate: string = '';
  
  flights: Flight[] = [];
  showResults: boolean = false;

  searchFlights() {
    // Simulate API call with static data
    this.flights = [
      {
        airline: 'Saudi Arabian Airlines',
        code: 'SA',
        rating: 4.8,
        reviews: 2340,
        duration: '8h 30m',
        class: 'Economy',
        stops: 'Direct',
        price: 680,
        meals: 'Meals included',
        baggage: '30kg baggage',
        amenities: ['Entertainment']
      },
      {
        airline: 'Emirates',
        code: 'AE',
        rating: 4.9,
        reviews: 3120,
        duration: '9h 15m',
        class: 'Economy',
        stops: '1 Stop',
        price: 850,
        meals: 'Premium meals',
        baggage: '40kg baggage',
        amenities: ['WiFi', 'Lounge access']
      },
      {
        airline: 'Qatar Airways',
        code: 'QA',
        rating: 4.9,
        reviews: 2890,
        duration: '8h 45m',
        class: 'Economy',
        stops: 'Direct',
        price: 820,
        meals: 'Gourmet meals',
        baggage: '35kg baggage',
        amenities: ['Premium entertainment']
      }
    ];
    this.showResults = true;
  }

  setTransportType(type: string) {
    this.transportType = type;
  }

  bookFlight(flight: Flight) {
    console.log('Booking flight:', flight);
    // Implement booking logic here
  }
}
