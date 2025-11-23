import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { withInterceptors } from '@angular/common/http';
import { loadingInterceptor } from './app/core/interceptors/loading.interceptor';
import { authInterceptorInterceptor } from './app/core/interceptors/auth-interceptor.interceptor';
import {
  LucideAngularModule,
  Globe,
  Home,
  Menu,
  Moon,
  Sun,
  LogOut,
  Search,
  ShoppingCart,
  User,
  X,
  Users,
  Building2,
  Headphones,
  Star,
  Clock,
  MapPin,
  Calendar,
  Check,
  CheckCircle,
  Mail,
  Shield,
  ShieldCheck,
  Info,
  Award,
  ArrowRight,
  Heart,
  Mountain,
  ChevronDown,
  LayoutDashboard,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Package,
  Bus,
  Settings,
  CreditCard,
  TrendingUp,
  Phone,
  SquareUser,
} from 'lucide-angular';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { withInMemoryScrolling } from '@angular/router';
import {ToastrModule} from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { routes } from './app/app.routes'; // define your routes in a separate file

import { errorInterceptor } from './app/core/interceptors/error.interceptor';

import { languageInterceptor } from './app/core/interceptors/language.interceptor';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    provideRouter(routes ,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),
    importProvidersFrom(BrowserAnimationsModule, ToastrModule.forRoot({
        timeOut: 3000,
        positionClass: 'toast-top-right',
        preventDuplicates: true,
    })),
    importProvidersFrom(
      LucideAngularModule.pick({
        Menu,
        Search,
        Globe,
        LogOut,
        Mail,
        MapPin,
        Shield,
        ShieldCheck,
        Info,
        Award,
        ArrowRight,
        Heart,
        Mountain,
        LayoutDashboard,
        UserCog,
        Sun,
        Moon,
        ShoppingCart,
        User,
        Home,
        X,
        Users,
        Building2,
        Headphones,
        Star,
        Clock,
        Check,
        CheckCircle,
        ChevronDown,
        ChevronLeft,
        ChevronRight,
        Calendar,
        Package,
        Bus,
        Settings,
        CreditCard,
        TrendingUp,
        Phone,
        SquareUser,
      })
    ),
    provideHttpClient(
      withInterceptors([loadingInterceptor, authInterceptorInterceptor, errorInterceptor, languageInterceptor])
    ),
  ],
}).catch((err) => console.error(err));
