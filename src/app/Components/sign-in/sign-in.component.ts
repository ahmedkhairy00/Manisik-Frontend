import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommonModule } from '@angular/common';
import { RegisterDto } from 'src/app/models/api';
import { NotificationService } from 'src/app/core/services/notification.service';
import { LucideAngularModule } from 'lucide-angular';


@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, CommonModule, LucideAngularModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignInComponent {
  registrationForm!: FormGroup;

  isLoading = false;
  errorMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  
  // Store API validation errors for each field
  apiErrors: { [key: string]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private registerService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {

    this.registrationForm = this.fb.group({
      FirstName: ['', [Validators.required, Validators.minLength(2)]],
      LastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{6,}$/)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  get passwordControl() {
    return this.registrationForm.get('password');
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value ? null : { passwordMismatch: true };
  }

   redirectToLogin() {
    this.router.navigate(['/login']);
  }

  register(): void {
    // Clear previous API errors
    this.apiErrors = {};
    this.errorMessage = '';

    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      this.notificationService.error('Please fill in all required fields correctly', 'Form Invalid');
      return;
    }

    this.isLoading = true;

    const registerData: RegisterDto = {
      email: this.registrationForm.value.email,
      password: this.registrationForm.value.password,
      firstName: this.registrationForm.value.FirstName || this.registrationForm.value.firstName || '',
      lastName: this.registrationForm.value.LastName || this.registrationForm.value.lastName || '',
      phoneNumber: this.registrationForm.value.phoneNumber || null,
    };

    this.registerService.register(registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response?.data?.user) {
          this.notificationService.success('Account created successfully! Please login.', 'Success');
          this.router.navigate(['/login']);
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
          this.notificationService.error(this.errorMessage, 'Error');
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        this.isLoading = false;

        
        // Handle validation errors from API
        if (error.error?.errors) {
          // Parse field-specific errors from the API response
          const errors = error.error.errors;
          Object.keys(errors).forEach(field => {
            // Normalize field name (API might use different casing)
            const normalizedField = field.toLowerCase();
            this.apiErrors[normalizedField] = errors[field];
            
            // Also set error on the form control if it exists
            const control = this.registrationForm.get(field) || this.registrationForm.get(normalizedField);
            if (control) {
              control.setErrors({ serverError: errors[field][0] });
              control.markAsTouched();
            }
          });
          
          this.notificationService.error('Please fix the validation errors', 'Validation Error');
        } else {
          this.errorMessage = error.error?.message || error.error?.title || 'Registration failed. Please try again.';
          this.notificationService.error(this.errorMessage, 'Error');
        }
        this.cdr.markForCheck();
      }
    });
  }
  
  // Helper to get API error for a field
  getApiError(fieldName: string): string | null {
    const errors = this.apiErrors[fieldName.toLowerCase()];
    return errors && errors.length > 0 ? errors[0] : null;
  }
}

