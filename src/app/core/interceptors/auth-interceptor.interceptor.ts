import { HttpInterceptorFn ,HttpRequest , HttpHandler,HttpEvent,HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Observable , throwError} from 'rxjs';
import { catchError ,switchMap } from 'rxjs/operators';

export const authInterceptorInterceptor: HttpInterceptorFn = (req, next) => {

  // inject AuthService to access authentication methods
  const authService = inject(AuthService);

  // Attach JWT tokenif available
  const token = authService.getToken();

  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }


  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // if error is 401 Unauthorized, attempt to refresh token
      if (error.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');

        if(!refreshToken){
          authService.logout();
          return throwError(() => error);
        }

        // call refresh token endpoint and retry original request
        return authService.refreshToken().pipe(
          switchMap((response) => {

            // reterying original request with new token
            const newAuthReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.token}`
              }
            });
            
            return next(newAuthReq);
          }),
          catchError((refreshError) => {
            // if refresh also fails, logout user
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
