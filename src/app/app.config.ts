import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withPreloading, NoPreloading } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptorInterceptor } from './core/interceptors/auth-interceptor.interceptor';
import { cacheInterceptor } from './core/interceptors/cache.interceptor';
import { 
  LucideAngularModule, 
  AlertCircle, Bed, Building, Building2, Bus, Calendar, Check, CheckCircle, ChevronDown, Clock, CreditCard, Edit, FileText, Flag, Globe, Lock, Mail, MapPin, Navigation, Plane, Plus, Receipt, RefreshCw, ShieldCheck, Star, Trash2, User, Users, XCircle, X,
  Facebook, Twitter, Instagram, Youtube
} from 'lucide-angular';

import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(NoPreloading)),
    provideAnimations(), // required animations providers
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true,
    }),
    provideHttpClient(withInterceptors([authInterceptorInterceptor, cacheInterceptor])),
    importProvidersFrom(LucideAngularModule.pick({
      AlertCircle, Bed, Building, Building2, Bus, Calendar, Check, CheckCircle, ChevronDown, Clock, CreditCard, Edit, FileText, Flag, Globe, Lock, Mail, MapPin, Navigation, Plane, Plus, Receipt, RefreshCw, ShieldCheck, Star, Trash2, User, Users, XCircle, X,
      Facebook, Twitter, Instagram, Youtube
    }))]
    
};
