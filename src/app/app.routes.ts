import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    // Route for hotel details. Place the more specific route before the list route
    {path: 'hotels/:id', loadComponent: () => import('./Components/hotel-details/hotel-details.component').then(m => m.HotelDetailsComponent),canActivate: [authGuard]},
    {path: 'hotels', loadComponent: () => import('./Components/hotel/hotel.component').then(m => m.HotelComponent) ,canActivate: [authGuard]},
    {path: 'booking-hotel', loadComponent: () => import('./Components/booking-hotel/booking-hotel.component').then(m => m.BookingHotelComponent), canActivate: [authGuard]},
    {path: 'transport', loadComponent: () => import('./Components/transport/transport.component').then(m => m.TransportComponent) , canActivate: [authGuard]},
    {path: 'signIn', loadComponent: () => import('./Components/sign-in/sign-in.component').then(m => m.SignInComponent)},
    {path: 'login', loadComponent: () => import('./Components/login/login.component').then(m => m.LoginComponent)},
    {path: 'dashboard', loadComponent: () => import('./Components/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard]},
    {path: '**', redirectTo: ''}


];