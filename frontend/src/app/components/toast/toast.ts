import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../services/toast/toast';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class ToastComponent implements OnInit {
  toasts$: Observable<ToastMessage[]>;

  constructor(public toastService: ToastService) {
    this.toasts$ = this.toastService.toasts$;
  }

  ngOnInit(): void {}
}
