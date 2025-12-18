import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  // Endpoints that should NOT show error toasters (background/silent requests)
  const silentEndpoints = [
    '/Auth/Me',
    '/MyPendingHotelBookings',
    '/MyPendingGroundBookings',
    '/MyPendingTransportBookings',
    '/MyBookings',
    '/AllBookings',
    '/Documents/',  // Suppress errors for visa/ticket PDF downloads
    '/Hotel/GetAllFiltered',  // Suppress errors when loading hotels
    '/Hotel/GetMyHotels'      // Suppress errors when loading user's hotels
  ];

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred!';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        if (error.status === 401) {
          errorMessage = 'Unauthorized access. Please login again.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (error.status === 404) {
          errorMessage = 'Resource not found.';
        } else if (error.status === 500) {
          errorMessage = 'Internal Server Error. Please try again later.';
        } else {
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
      }

      // Only show toast for user-initiated actions, skip background requests
      const shouldSkipToast = silentEndpoints.some(ep => req.url.includes(ep));
      if (!shouldSkipToast) {
        notificationService.error(errorMessage, 'Error');
      }

      // Re-throw error so components can handle it if needed
      return throwError(() => error);
    })
  );
};

