import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if token exists
  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Wait for user to load (or confirm it's already loaded)
  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      // If user is loaded or token exists, allow access
      if (user || authService.isAuthenticated()) {
        return true;
      }
      
      // Otherwise redirect to login
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
};
