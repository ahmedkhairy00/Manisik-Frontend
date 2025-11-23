import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MatListModule} from '@angular/material/list';
import { NavbarComponent } from './Components/navbar/navbar.component';
import { FooterComponent } from './Components/footer/footer.component'; 
import { LoadingService } from './core/services/loading.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [MatListModule, RouterOutlet, FormsModule, NavbarComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Manasik-Client';
  constructor(public LoadingService : LoadingService) {}
}
