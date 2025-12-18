import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CacheService } from '../services/cache.service';
import { of, tap } from 'rxjs';

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next(req);
  }

  // Skip caching for specific endpoints if needed (e.g. auth-check)
  // if (req.url.includes('/auth/check')) return next(req);

  const cacheService = inject(CacheService);
  const cachedResponse = cacheService.get(req.urlWithParams);

  if (cachedResponse) {
    // Return cached response wrapped in HttpResponse
    return of(new HttpResponse({ body: cachedResponse }));
  }

  // Pass request to next handler and cache the response
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cacheService.set(req.urlWithParams, event.body);
      }
    })
  );
};
