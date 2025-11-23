import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../interfaces';
import { map, take, filter, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Check if token exists first
    if (!authService.isAuthenticated()) {
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Wait for user to be loaded (with timeout to prevent infinite waiting)
    return authService.currentUser$.pipe(
      filter(user => user !== null), // Wait until user is not null
      take(1), // Take only the first non-null value
      timeout(5000), // Timeout after 5 seconds
      map(user => {
        if (!user) {
          router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }

        if (allowedRoles.includes(user.role)) {
          return true;
        }

        router.navigate(['/home']);
        return false;
      }),
      catchError(() => {
        // If timeout or error occurs, redirect to login
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return of(false);
      })
    );
  };
};
