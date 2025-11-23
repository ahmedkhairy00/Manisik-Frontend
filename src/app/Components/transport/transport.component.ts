import { Component, inject } from '@angular/core';
import { I18nService } from 'src/app/core/services/i18n.service';

import { MatToolbarModule, MatToolbar } from '@angular/material/toolbar';
import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ArrivalAirport, TransportSearchParams, TransportType,DepartureAirport, TransportOption } from 'src/app/interfaces/transport.interface';

import { CommonModule } from '@angular/common';
import { TransportService } from 'src/app/core/services/transport.service';

import { c } from "../../../../node_modules/@angular/cdk/a11y-module.d-DBHGyKoh";

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
  imports: [MatToolbar, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule, CommonModule],
  templateUrl: './transport.component.html',
  styleUrl: './transport.component.css'
})
export class TransportComponent {

  //convert enum to array of strings to use in dropdown
  readonly i18n = inject(I18nService);
   arrivalAirports : string[] = Object.values(ArrivalAirport); 
   derpartureAirports : string[] = Object.values(DepartureAirport);
   searchParams:TransportSearchParams={}
   flights:TransportOption[]=[];
 
  constructor(private transportService: TransportService) {





  }
 
  setTransportType(type: string) {
    this.searchParams.type = type ;
  }

  searchflights() {
      if (!this.searchParams.departureLocation || !this.searchParams.arrivalLocation) {
      alert('Please select both departure and arrival airports!');
      return;
  }

     console.log(this.searchParams.departureLocation);
     console.log(this.searchParams.arrivalLocation);
     this.transportService.searchByRoute(this.searchParams.departureLocation || '', this.searchParams.arrivalLocation || '').subscribe((response: any) => {
    this.flights = response.data||[];
    console.log(response);
    
    });
  }
}

  


