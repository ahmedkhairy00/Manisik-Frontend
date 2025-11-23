import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { HeroSliderComponent } from './hero-slider/hero-slider.component';
import { AIChatComponent } from './ai-chat/ai-chat.component';
import { I18nService } from 'src/app/core/services/i18n.service';

/* ----------  INTERFACES – KEYS ONLY  ---------- */
export interface QuickAction {
  icon: string;
  color: string;
  route?: string;
  titleKey: string;
  descriptionKey: string;
}

export interface Package {
  id: number;
  titleKey: string;
  image: string;
  price: number;
  duration: number; // days (number)
  rating: number;
  reviews: number;
  category: string;
  includedKeys: string[]; // translation keys
}

export interface Step {
  icon: string;
  step: string;
  titleKey: string;
  descriptionKey: string;
}

export interface Statistic {
  icon: string;
  value: number;
  suffix: string;
  label: string; // translation key
}

export interface Testimonial {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  textKey: string;
  verified: boolean;
}

export interface FAQ {
  questionKey: string;
  answerKey: string;
}

/* ----------  COMPONENT  ---------- */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideAngularModule,
    HeroSliderComponent,
    AIChatComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  t(key: string): string {
    return this.i18n.translate(key);
  }

  /* ----------  STATE  ---------- */
  readonly animateIn = signal<boolean>(false);
  readonly openFAQ = signal<string | null>(null);
  readonly searchQuery = signal<string>('');
  readonly newsletterEmail = signal<string>('');
  readonly isSubmittingNewsletter = signal<boolean>(false);
  readonly selectedCategory = signal<string>('All');

  /* ----------  DATA – KEYS ONLY  ---------- */
  readonly actions: QuickAction[] = [
    {
      icon: 'package',
      color: 'rgba(var(--primary-rgb), 0.1)',
      route: '/packages',
      titleKey: 'home.actions.0.title',
      descriptionKey: 'home.actions.0.desc',
    },
    {
      icon: 'building-2',
      color: 'rgba(16, 185, 129, 0.1)',
      route: '/hotels',
      titleKey: 'home.actions.1.title',
      descriptionKey: 'home.actions.1.desc',
    },
    {
      icon: 'bus',
      color: 'rgba(245, 158, 11, 0.1)',
      route: '/transport',
      titleKey: 'home.actions.2.title',
      descriptionKey: 'home.actions.2.desc',
    },
  ];

  readonly packages: Package[] = [
    {
      id: 1,
      titleKey: 'home.packages.title.premium',
      image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzYxOTExMzQwfDA&ixlib=rb-4.1.0&q=80&w=1080',
      price: 2499,
      duration: 14,
      rating: 4.8,
      reviews: 234,
      category: 'Premium',
      includedKeys: ['5star', 'flights', 'visa', 'transport'],
    },
    {
      id: 2,
      titleKey: 'home.packages.title.standard',
      image: 'https://images.unsplash.com/photo-1662104128135-7bd873b2befd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpc2xhbWljJTIwYXJjaGl0ZWN0dXJlJTIwcGF0dGVybnxlbnwxfHx8fDE3NjE5Nzk0NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      price: 1799,
      duration: 10,
      rating: 4.6,
      reviews: 189,
      category: 'Standard',
      includedKeys: ['4star', 'visa', 'transport', 'breakfast'],
    },
    {
      id: 3,
      titleKey: 'home.packages.title.economy',
      image: 'https://images.unsplash.com/photo-1571909552531-1601eaec8f79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrYWFiYSUyMG1lY2NhJTIwaG9seXxlbnwxfHx8fDE3NjIwMDAzMzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      price: 1299,
      duration: 7,
      rating: 4.5,
      reviews: 156,
      category: 'Economy',
      includedKeys: ['3star', 'visa', 'shared'],
    },
    {
      id: 4,
      titleKey: 'home.packages.title.vip',
      image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHJvb218ZW58MXx8fHwxNzYxOTExMzQwfDA&ixlib=rb-4.1.0&q=80&w=1080',
      price: 4999,
      duration: 21,
      rating: 5,
      reviews: 98,
      category: 'VIP',
      includedKeys: ['luxury', 'business', 'guide', 'concierge'],
    },
  ];

  readonly categories = ['All', 'Economy', 'Standard', 'Premium', 'VIP'];
  readonly filteredPackages = computed(() => {
    const cat = this.selectedCategory();
    return cat === 'All' ? this.packages : this.packages.filter(p => p.category === cat);
  });

  readonly steps: Step[] = [
    { icon: 'search', step: '01', titleKey: 'home.steps.0.title', descriptionKey: 'home.steps.0.desc' },
    { icon: 'settings', step: '02', titleKey: 'home.steps.1.title', descriptionKey: 'home.steps.1.desc' },
    { icon: 'credit-card', step: '03', titleKey: 'home.steps.2.title', descriptionKey: 'home.steps.2.desc' },
    { icon: 'check-circle', step: '04', titleKey: 'home.steps.3.title', descriptionKey: 'home.steps.3.desc' },
  ];

  readonly stats: Statistic[] = [
    { icon: 'users', value: 50000, suffix: '+', label: 'stats.totalBookings' },
    { icon: 'trending-up', value: 98, suffix: '%', label: 'stats.satisfactionRate' },
    { icon: 'headphones', value: 24, suffix: '/7', label: 'stats.supportAvailable' },
    { icon: 'map-pin', value: 200, suffix: '+', label: 'stats.destinations' },
  ];

  readonly testimonials: Testimonial[] = [
    { id: 1, name: 'Ahmed Hassan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed', rating: 5, textKey: 'testimonials.items.0', verified: true },
    { id: 2, name: 'Fatima Zahra', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima', rating: 5, textKey: 'testimonials.items.1', verified: true },
    { id: 3, name: 'Mohammad Ali', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammad', rating: 5, textKey: 'testimonials.items.2', verified: true },
  ];

  readonly faqs: FAQ[] = [
    { questionKey: 'faq.items.0.question', answerKey: 'faq.items.0.answer' },
    { questionKey: 'faq.items.1.question', answerKey: 'faq.items.1.answer' },
    { questionKey: 'faq.items.2.question', answerKey: 'faq.items.2.answer' },
    { questionKey: 'faq.items.3.question', answerKey: 'faq.items.3.answer' },
    { questionKey: 'faq.items.4.question', answerKey: 'faq.items.4.answer' },
    { questionKey: 'faq.items.5.question', answerKey: 'faq.items.5.answer' },
    { questionKey: 'faq.items.6.question', answerKey: 'faq.items.6.answer' },
    { questionKey: 'faq.items.7.question', answerKey: 'faq.items.7.answer' },
  ];

  ngOnInit(): void {
    setTimeout(() => this.animateIn.set(true), 100);
  }

  ngOnDestroy(): void {}

  /* ----------  PUBLIC METHODS  ---------- */
  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  toggleFAQ(question: string): void {
    this.openFAQ.update(curr => (curr === question ? null : question));
  }

  isFAQOpen(question: string): boolean {
    return this.openFAQ() === question;
  }

  onSearchSubmit(): void {
    const q = this.searchQuery().trim();
    if (q) this.router.navigate(['/search'], { queryParams: { q } }).catch(console.error);
  }

  onActionClick(action: QuickAction): void {
    if (action.route) this.router.navigate([action.route]).catch(console.error);
  }

  onViewPackageDetails(id: number): void {
    this.router.navigate(['/packages', id]).catch(console.error);
  }

  onViewAllPackages(): void {
    this.router.navigate(['/packages']).catch(console.error);
  }

  onNewsletterSubmit(): void {
    const email = this.newsletterEmail().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return; // TODO toast
    this.isSubmittingNewsletter.set(true);
    setTimeout(() => {
      this.isSubmittingNewsletter.set(false);
      this.newsletterEmail.set('');
      // TODO toast success
    }, 1000);
  }

  getStarArray(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}
