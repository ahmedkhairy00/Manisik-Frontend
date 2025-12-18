import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DynamicFieldConfig } from '../../../interfaces/dynamic-field.interface';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './dynamic-form.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    /* Custom scrollbar for webkit browsers */
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: var(--border, #e5e7eb);
      border-radius: 20px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicFormComponent implements OnInit {
  @Input() config: DynamicFieldConfig[] = [];
  @Input() submitLabel: string = 'Submit';
  @Input() loading: boolean = false;
  @Output() formSubmit = new EventEmitter<any>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.createForm();
  }

  createForm() {
    const group: any = {};

    this.config.forEach(field => {
      const validators = [];
      if (field.validators) {
        if (field.validators.required) validators.push(Validators.required);
        if (field.validators.minLength) validators.push(Validators.minLength(field.validators.minLength));
        if (field.validators.maxLength) validators.push(Validators.maxLength(field.validators.maxLength));
        if (field.validators.email) validators.push(Validators.email);
        if (field.validators.min !== undefined) validators.push(Validators.min(field.validators.min));
        if (field.validators.max !== undefined) validators.push(Validators.max(field.validators.max));
        if (field.validators.pattern) validators.push(Validators.pattern(field.validators.pattern));
      }
      
      group[field.name] = [field.value || '', validators];
    });

    this.form = this.fb.group(group);
  }

  onSubmit() {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  getErrorMessage(field: DynamicFieldConfig): string {
    const control = this.form.get(field.name);
    if (!control || !control.errors) return '';

    if (control.hasError('required')) return field.errorMessages?.required || `${field.label} is required`;
    if (control.hasError('minlength')) return field.errorMessages?.minLength || `${field.label} must be at least ${field.validators?.minLength} characters`;
    if (control.hasError('maxlength')) return field.errorMessages?.maxLength || `${field.label} cannot exceed ${field.validators?.maxLength} characters`;
    if (control.hasError('email')) return field.errorMessages?.email || `Invalid email address`;
    if (control.hasError('min')) return field.errorMessages?.min || `${field.label} must be at least ${field.validators?.min}`;
    if (control.hasError('max')) return field.errorMessages?.max || `${field.label} cannot exceed ${field.validators?.max}`;
    if (control.hasError('pattern')) return field.errorMessages?.pattern || `Invalid format`;

    return '';
  }
}
