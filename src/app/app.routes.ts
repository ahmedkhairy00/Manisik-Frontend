import { Routes } from '@angular/router';


export const routes: Routes = [

    {path: '', loadComponent: () => import('./Components/home/home.component').then(m => m.HomeComponent)},
    {path: 'packages', loadComponent: () => import('./Components/booking-package/booking-package.component').then(m => m.BookingPackageComponent)},
    // Route for hotel details. Place the more specific route before the list route
    {path: 'hotels/:id', loadComponent: () => import('./Components/hotel-details/hotel-details.component').then(m => m.HotelDetailsComponent)},
    {path: 'hotels', loadComponent: () => import('./Components/hotel/hotel.component').then(m => m.HotelComponent)},
    {path: 'booking-hotel', loadComponent: () => import('./Components/booking-hotel/booking-hotel.component').then(m => m.BookingHotelComponent)},
    {path: 'transport', loadComponent: () => import('./Components/transport/transport.component').then(m => m.TransportComponent)},
    {path: 'signIn', loadComponent: () => import('./Components/sign-in/sign-in.component').then(m => m.SignInComponent)},
    {path: 'login', loadComponent: () => import('./Components/login/login.component').then(m => m.LoginComponent)},
    {path: 'dashboard', loadComponent: () => import('./Components/dashboard/dashboard.component').then(m => m.DashboardComponent)},
    {path: '**', redirectTo: ''}


];
