import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './Components/home/home.component';
import { BookingPackageComponent } from './Components/booking-package/booking-package.component';
import { HotelComponent } from './Components/hotel/hotel.component';
import { TransportComponent } from './Components/transport/transport.component';
import { SignInComponent } from './Components/sign-in/sign-in.component';
import { LoginComponent } from './Components/login/login.component';

export const routes: Routes = [

    {path: '', loadComponent: () => import('./Components/home/home.component').then(m => m.HomeComponent)},
    {path: 'packages', loadComponent: () => import('./Components/booking-package/booking-package.component').then(m => m.BookingPackageComponent)},
    {path: 'hotels', loadComponent: () => import('./Components/hotel/hotel.component').then(m => m.HotelComponent)},
    {path: 'transport', loadComponent: () => import('./Components/transport/transport.component').then(m => m.TransportComponent)},
    {path: 'signIn', loadComponent: () => import('./Components/sign-in/sign-in.component').then(m => m.SignInComponent)},
    {path: 'login', loadComponent: () => import('./Components/login/login.component').then(m => m.LoginComponent)},
    {path: '**', redirectTo: ''}
    

];
bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes)],
});