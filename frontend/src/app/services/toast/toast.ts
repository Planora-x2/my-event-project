import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  toasts$ = this.toastsSubject.asObservable();
  private nextId = 0;

  show(message: string, type: 'info' | 'warning' = 'info') {
    const toast: ToastMessage = { id: this.nextId++, message, type };
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      this.remove(toast.id);
    }, 3000);
  }

  remove(id: number) {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
  }
}
