import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommonModule } from '@angular/common';
import { NotificationService } from 'src/app/core/services/notification.service';
import { LucideAngularModule } from 'lucide-angular';



@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule ,CommonModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone : true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  loginForm!: FormGroup;
  errorMessage: string = '';
  showPassword: boolean = false;
  private returnUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login({ email, password }, rememberMe).subscribe({
      next: (response) => {
        if (response?.data?.token) {
          const name = response.data.user?.firstName ?? '';
          this.notificationService.success(`Login successful! Welcome ${name}`, 'Success');
          
          let navigateTo = this.returnUrl || '/';
          // Fix: Prevent redirecting back to login/signin pages
          if (navigateTo.toLowerCase().includes('login') || navigateTo.toLowerCase().includes('signin')) {
            navigateTo = '/';
          }
          
          this.router.navigateByUrl(navigateTo).catch(() => {});
        } else {
          this.errorMessage = 'Login failed. Please try again.';
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }
}
