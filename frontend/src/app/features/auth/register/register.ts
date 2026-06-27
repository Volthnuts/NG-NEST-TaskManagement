import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared-modules';
import { ApiService } from '../../../core/services/api.service'; // 💡 อย่าลืมอิมพอร์ต ApiService ของเราเข้ามาครับ

@Component({
  selector: 'app-register',
  standalone: true, // มั่นใจว่าเปิดใช้งานเป็น Standalone Component เรียบร้อย
  imports: [
    SharedModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  // 💡 1. ประกาศตัวแปรสลับหน้าจอสถานะ
  isRegisteredSuccess = false;

  // 💡 2. ประกาศตัวแปรสำหรับผอม (Two-way Data Binding กับ [(ngModel)] ใน HTML)
  email = '';
  password = '';
  confirmPassword = '';

  // 💡 3. ฉีด ApiService เข้ามาทาง Constructor เพื่อให้เรียกใช้พ่นข้อมูลได้
  constructor(private apiService: ApiService) {}

  onRegister() {
    // เช็กเบื้องต้นก่อนส่งข้อมูล (Optional แต่ใส่ไว้ปลอดภัยดีครับ)
    if (!this.email || !this.password || !this.confirmPassword) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    const registerData = { 
      email: this.email, 
      password: this.password, 
      confirmPassword: this.confirmPassword 
    };
    
    this.apiService.post<any>('/auth/register', registerData).subscribe({
      next: (res) => {
        // 💡 เปลี่ยนสถานะแทนการเปลี่ยนหน้า เพื่อให้ HTML โชว์ข้อความแนะนำให้ไปเปิดดูอีเมล
        this.isRegisteredSuccess = true; 
      },
      error: (err) => {
        // ดักเอา Message แย่ๆ ที่ส่งมาจาก NestJS ดัก BadRequestException / ConflictException โชว์ให้ผู้ใช้เห็น
        alert(err.error?.message || 'การสมัครสมาชิกผิดพลาด');
      }
    });
  }
}