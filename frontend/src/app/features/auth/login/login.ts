import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared-modules';
import { ApiService } from '../../../core/services/api.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // อิมพอร์ตคลาสที่จำเป็นเพิ่มเข้ามา
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    SharedModule // มั่นใจว่าใน SharedModule มีการอิมพอร์ต ReactiveFormsModule ไว้แล้ว
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  loginForm!: FormGroup; // สร้างตัวแปรควบคุมฟอร์มหลัก
  isLoading = false;

  constructor(
    private authService: AuthService, // เปลี่ยนมาใช้ AuthService
    private router: Router,
    private cdr: ChangeDetectorRef, // inject เพิ่ม สั่งให้ re-render เอง ไม่ค้องรอ Zone ที่จะคอยจับ async operation
    private fb: FormBuilder // ฉีด FormBuilder เข้ามาจัดการฟอร์ม
  ) {}

  ngOnInit(): void {
    // ประกาศโครงสร้างฟอร์มพร้อมติด Validators
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onLogin() {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.isLoading = true;
  const credentials = this.loginForm.value;

  // เปลี่ยนจาก apiService.post → authService.login
  // เพราะ authService.login จะอัปเดต currentUserSubject ให้ด้วย
  this.authService.login(credentials).subscribe({
    next: (user) => {
      this.isLoading = false;
      this.cdr.detectChanges();
      this.router.navigate(['/projetSelect']);
    },
    error: (err) => {
      this.isLoading = false;
      alert(err.error?.message || 'Login failed. Please check your credentials.');
    }
  });
}
}