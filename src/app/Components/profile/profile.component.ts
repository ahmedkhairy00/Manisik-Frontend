import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from 'src/app/core/services/i18n.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-3xl mx-auto p-6 bg-[var(--surface)] rounded-lg shadow-md my-10">
      <h2 class="text-2xl font-bold mb-4">{{ i18n.t('nav.users') }}</h2>
      <div *ngIf="user">
        <div class="mb-4">
          <div class="font-semibold">{{ user.fullName || (user.firstName + ' ' + user.lastName) }}</div>
          <div class="text-sm text-[var(--text-secondary)]">{{ user.email }}</div>
          <div class="text-sm text-[var(--text-secondary)]">{{ user.phoneNumber || user.phone }}</div>
        </div>
        <p class="text-[var(--text-secondary)]">Profile editing is not implemented yet.</p>
      </div>
      <div *ngIf="!user">Loading...</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  user: any = null;

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(u => {
      this.user = u;
      this.cdr.markForCheck();
    });
  }
}
