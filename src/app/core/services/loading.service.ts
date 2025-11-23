import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  show(): void {
    Promise.resolve().then(() => this.loadingSubject.next(true));
  }

  hide(): void {
    Promise.resolve().then(() => this.loadingSubject.next(false));
  }

  getLoadingValue(): boolean {
    return this.loadingSubject.value;
  }
}

