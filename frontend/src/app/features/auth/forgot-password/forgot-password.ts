import { ChangeDetectorRef, Component } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared-modules';

@Component({
  selector: 'app-forgot-password',
  imports: [
    SharedModule
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  email = '';
  isLoading = false;
  isSentSuccess = false;
  message = '';

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit() {
    if (!this.email.trim()) return;

    this.isLoading = true;

    const body = {
      email: this.email,
      resetUrl: 'http://localhost:4200/resetPassword'
    }

    this.apiService.post<any>('/users/forgot-password', body).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isSentSuccess = true;
        this.message = res.message;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'เกิดข้อผิดพลาดในการส่งคำขอ');
      }
    });
  }
}
