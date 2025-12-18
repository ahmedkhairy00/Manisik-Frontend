import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { getErrorMessage } from '../utils/error.utils';

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private toastr = inject(ToastrService);

  show(
    message: string,
    type: NotificationType = NotificationType.INFO,
    title?: string
  ): void {
    switch (type) {
      case NotificationType.SUCCESS:
        this.toastr.success(message, title || 'Success');
        break;
      case NotificationType.ERROR:
        this.toastr.error(message, title || 'Error');
        break;
      case NotificationType.WARNING:
        this.toastr.warning(message, title || 'Warning');
        break;
      case NotificationType.INFO:
        this.toastr.info(message, title || 'Info');
        break;
    }
  }

  success(message: string, title?: string): void {
    this.show(message, NotificationType.SUCCESS, title);
  }

  error(messageOrError: string | any, title?: string): void {
    const message = typeof messageOrError === 'string' 
      ? messageOrError 
      : getErrorMessage(messageOrError, 'An error occurred');
      
    this.show(message, NotificationType.ERROR, title);
  }

  warning(message: string, title?: string): void {
    this.show(message, NotificationType.WARNING, title);
  }

  info(message: string, title?: string): void {
    this.show(message, NotificationType.INFO, title);
  }
}
