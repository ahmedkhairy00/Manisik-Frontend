import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    // Route for hotel details. Place the more specific route before the list route
    {path: '', loadComponent: () => import('./Components/home/home.component').then(m => m.HomeComponent)},
    {path: 'hotels/:id', loadComponent: () => import('./Components/hotel-details/hotel-details.component').then(m => m.HotelDetailsComponent),canActivate: [authGuard]},
    {path: 'hotels', loadComponent: () => import('./Components/hotel/hotel.component').then(m => m.HotelComponent) ,canActivate: [authGuard]},
    {path: 'booking-hotel', loadComponent: () => import('./Components/booking-hotel/booking-hotel.component').then(m => m.BookingHotelComponent), canActivate: [authGuard]},
    {path: 'booking-package', loadComponent: () => import('./Components/booking-package/booking-package.component').then(m => m.BookingPackageComponent), canActivate: [authGuard]},
    {path: 'booking-confirmation/:id', loadComponent: () => import('./Components/booking-confirmation/booking-confirmation.component').then(m => m.BookingConfirmationComponent), canActivate: [authGuard]},
    {path: 'booking-confirmation', loadComponent: () => import('./Components/booking-confirmation/booking-confirmation.component').then(m => m.BookingConfirmationComponent), canActivate: [authGuard]},
    {path: 'transport', loadComponent: () => import('./Components/transport/transport.component').then(m => m.TransportComponent) , canActivate: [authGuard]},
    // Booking transport/ground pages (individual booking forms)
    {path: 'booking-transport', loadComponent: () => import('./Components/booking-transport/booking-transport.component').then(m => m.BookingTransportComponent), canActivate: [authGuard]},
    {path: 'booking-ground', loadComponent: () => import('./Components/booking-ground/booking-ground.component').then(m => m.BookingGroundComponent), canActivate: [authGuard]},
    // Booking International Transport (from remote)
    {path: 'booking/international', loadComponent: () => import('./Components/booking-international-transport/booking-international-transport.component').then(m => m.BookingInternationalTransportComponent)},
    
    {path: 'signIn', loadComponent: () => import('./Components/sign-in/sign-in.component').then(m => m.SignInComponent)},
    {path: 'login', loadComponent: () => import('./Components/login/login.component').then(m => m.LoginComponent)},
    {path: 'dashboard', loadComponent: () => import('./Components/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard]},
    {path: 'profile', loadComponent: () => import('./Components/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard]},

    {path: '**', redirectTo: ''}
     

];
