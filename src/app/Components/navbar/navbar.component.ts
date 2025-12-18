import { Component, signal, computed, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { I18nService } from 'src/app/core/services/i18n.service';
import { DashboardService } from 'src/app/core/services/dashboard.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Subscription } from 'rxjs';
import { User, NavLink, NavIcon } from 'src/app/interfaces';
import { LucideAngularModule } from 'lucide-angular';
import { NgZone } from '@angular/core';
import { NotificationService } from 'src/app/core/services/notification.service';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private authSubscription?: Subscription;
  private readonly ngZone = inject(NgZone);
  private readonly notificationService = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);


  // Signals
  readonly UserStatus = signal<boolean>(false);
  readonly isUserDropdownOpen = signal<boolean>(false);
  readonly currentUser = signal<User | null>(null);
  readonly isLoadingUser = signal<boolean>(false);
  readonly isMobileMenuOpen = signal<boolean>(false);
  readonly cartCount = signal<number>(0);
  readonly isDarkMode = signal<boolean>(false);

  readonly i18n = inject(I18nService);
  readonly dashboardService = inject(DashboardService);

  readonly hasCartItems = computed(() => this.cartCount() > 0);

  readonly direction = computed(() =>
    document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'
  );

  readonly navLinks: NavLink[] = [
    { key: 'nav.home', path: '/', icon: 'home' },
    { key: 'nav.bookingTrip', path: '/booking-package', icon: 'calendar-check' },
    { key: 'nav.hotels', path: '/hotels', icon: 'building-2' },
    { key: 'nav.transport', path: '/transport', icon: 'bus' },
  ];

  readonly navIcons: NavIcon[] = [
    { name: 'search', ariaLabel: 'Search', action: () => this.handleSearch() },
    { name: 'globe', ariaLabel: 'Change Language', action: () => this.handleLanguageChange() },
    { name: 'moon', ariaLabel: 'Toggle Dark Mode', action: () => this.handleThemeToggle() },
    { name: 'shopping-cart', ariaLabel: 'View Shopping Cart', action: () => this.handleCartClick(), showBadge: true },
    { name: 'user', ariaLabel: 'User Account', action: () => this.handleUserClick() },
    { name: 'menu', ariaLabel: 'Toggle Mobile Menu', action: () => this.toggleMobileMenu() },
  ];

  ngOnInit(): void {
    // Subscribe to auth service for reactive user updates
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      this.UserStatus.set(!!user);
    });

    // Load saved theme
    const savedDark = localStorage.getItem('app_dark') === '1';
    this.isDarkMode.set(savedDark);
    this.applyThemeState(savedDark);

    // Language is now fully managed by i18n.service
    // Apply current language attributes on init
    // Apply current language attributes on init
    this.applyLanguageAttributes(this.i18n.getCurrentLanguage());
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  logOut(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.notificationService.success(this.i18n.translate('nav.logoutSuccess'), 'Success');
        this.closeMobileMenu();
        this.closeUserDropdown();
        this.currentUser.set(null);
        // Navigation is handled by auth service
        this.cdr.markForCheck();
      },
      error: (err) => {

        this.notificationService.error('Logout failed', 'Error');
        // Still clear local state on error
        this.closeMobileMenu();
        this.closeUserDropdown();
        this.currentUser.set(null);
        this.cdr.markForCheck();
      }
    });
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  closeUserDropdown(): void {
    this.isUserDropdownOpen.set(false);
  }

  onNavLinkClick(): void {
    this.closeMobileMenu();
    this.closeUserDropdown();
  }

  onIconClick(icon: NavIcon): void {
    icon.action?.();
  }

  public handleSearch(): void {
    this.router.navigate(['/search']).catch(() => {});
  }

  public handleLanguageChange(): void {
    const currentLang = this.i18n.getCurrentLanguage();
    const nextLang = currentLang === 'en' ? 'ar' : 'en';

    // i18n.service handles localStorage saving
    this.i18n.setLanguage(nextLang);
    this.applyLanguageAttributes(nextLang);
  }

  private applyLanguageAttributes(lang: 'en' | 'ar') {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  public handleThemeToggle(): void {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    try { localStorage.setItem('app_dark', next ? '1' : '0'); } catch {}
    this.applyThemeState(next);
  }

  public applyThemeState(dark: boolean): void {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }

  public handleCartClick(): void {
    this.router.navigate(['/cart']).catch(() => {});
  }

  public handleUserClick(): void {
    if (!this.UserStatus()) {
      this.router.navigate(['/login']).catch(() => {});
      return;
    }
    this.openUserModel();
  }

  updateCartCount(count: number): void {
    this.cartCount.set(count);
  }

  public isDarkModeValue(): boolean {
    return this.isDarkMode();
  }
  

openUserModel(): void {
  if (!this.UserStatus()) {
    this.router.navigate(['/login']);
    return;
  }

  // Toggle dropdown
  this.isUserDropdownOpen.update(v => !v);

  // Fetch user if not loaded
  if (!this.currentUser() && this.isUserDropdownOpen()) {
    this.isLoadingUser.set(true);

    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.ngZone.run(() => {
        this.currentUser.set(user); // must update the local signal
        this.authService.updateCurrentUser(user); // optional: keep service in sync
        this.isLoadingUser.set(false);
        this.cdr.markForCheck();
        });
      },
      error: (err) => {
         this.ngZone.run(() => {
        console.error('Failed to fetch user:', err);
        this.isLoadingUser.set(false);
        this.closeUserDropdown();
        this.cdr.markForCheck();
         });
      }
    });
  }
}



  navigateToDashboard(): void {
    this.closeUserDropdown();
    this.router.navigate(['/dashboard']).catch(() => {});
  }

  navigateToProfile(): void {
    this.closeUserDropdown();
    this.router.navigate(['/profile']).catch(() => {});
  }
}
