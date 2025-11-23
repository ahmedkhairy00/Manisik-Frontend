import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule ,CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone : true
})
export class LoginComponent {
loginForm!: FormGroup;
  errorMessage: string = '';
  showPassword: boolean = false;

  constructor(private fb: FormBuilder, private loginService: AuthService, private router: Router , private toastr: ToastrService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const loginData = this.loginForm.value;

    this.loginService.login(loginData).subscribe({
      next: (response) => {
        if (response.data?.token) {
          // Get remember me value from the checkbox (not part of the form group currently, let's check HTML)
          // The HTML has an input with id="remember" but no formControlName.
          // I will update the HTML to use formControlName or just get the value from the DOM/variable.
          // Better to add it to the form group.
          const rememberMe = this.loginForm.get('rememberMe')?.value || false;
          
          this.loginService.setAuthData(response.data, rememberMe); 

          this.toastr.success(`Login successful! Welcome ${response.data.user.firstName}`, 'Success');
          this.router.navigate(['/home']);
        } else {
          this.errorMessage = 'Login failed. Please try again.'; 
          console.error('Login failed: No token received');
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        console.error('Login error:', error);
      }
    });
  }
}
