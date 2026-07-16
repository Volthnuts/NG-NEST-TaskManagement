import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared-modules';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';   // อิมพอร์ตเพิ่ม
import { AuthService } from '../../../core/auth/auth.service';   // อิมพอร์ตเพิ่ม

interface UserProfileInterface {
  id: string;
  name: string;
  email: string;
  bio: string;
  role: string;
  joinedAt: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    SharedModule
  ],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfile implements OnInit {
  profileId: string | null = null;
  currentUserId: string | null = null; 
  isOwnProfile = false;
  isEditMode = false;

  // ข้อมูลโปรไฟล์เริ่มต้น (จะถูกเขียนทับเมื่อโหลดจาก API สำเร็จ)
  user: UserProfileInterface = {
    id: '',
    name: '',
    email: '',
    bio: '',
    role: '',
    joinedAt: ''
  };

  // ฉีด Services ทั้งหมดเข้ามาใช้งานในนี้ให้ถูกต้อง
  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
      // ดึงข้อมูลออกมาเป็นก้อน String ก่อน (ถ้าไม่มีให้ทำ Fallback เป็นข้อความว่าง '{}')
      const currentUserString = localStorage.getItem('current_user') || '{}';

      // แปลงร่างให้เป็น Object แล้วค่อยเจาะดึงฟิลด์ id ออกมาใช้งาน
      this.currentUserId = JSON.parse(currentUserString).id;

      this.loadUserProfile();
  }

  loadUserProfile() {
    this.apiService.get<UserProfileInterface>(`/users/my-profile`).subscribe({
      next: (data) => {
        this.user = data;
        console.log('this.user in my profile : ',data)
        // เช็กสิทธิ์อีกครั้งเพื่อความชัวร์จากข้อมูลที่ได้มาจาก DB หลังบ้าน
        this.isOwnProfile = (this.user.id === this.currentUserId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert(err.error?.message || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
      }
    });
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
  }

  onSubmit() {
    if (!this.user.name.trim()) return;

    // เตรียมก้อนข้อมูลส่งไปเซฟที่ NestJS
    const formData = {
      name: this.user.name,
      email: this.user.email,
      bio: this.user.bio
    };

    // ย้ายโลจิกมาอยู่ข้างใน onSubmit ให้ถูกต้องตามโครงสร้างภาษา
    this.apiService.put<any>(`/users/my-profile`, formData).subscribe({
      next: (res) => {
        // ถ้าสถานะกลายเป็น PENDING แปลว่ายูสเซอร์เปลี่ยนอีเมล และหลังบ้านสั่งล็อกเอาต์แล้ว
        if (res.status === 'PENDING') {
          alert('เปลี่ยนอีเมลสำเร็จ! ระบบได้ส่งลิงก์ยืนยันตัวตนไปที่อีเมลใหม่แล้ว กรุณายืนยันตัวตนก่อนเข้าสู่ระบบอีกครั้ง');
          this.authService.logout(); // สั่งล้าง State ฝั่งหน้าบ้านและเตะไปหน้า Login ทันที
        } else {
          alert('อัปเดตโปรไฟล์สำเร็จ!');
          this.isEditMode = false;
          // อัปเดตข้อมูลการแสดงผลปัจจุบันในหน้าจอ
          this.user.name = res.name;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        alert(err.error?.message || 'ไม่สามารถอัปเดตข้อมูลได้');
      }
    });
  }

  onLogout() {
    if (confirm('Are you sure you want to log out?')) {
      // ใช้ฟังก์ชัน logout ของ AuthService เพื่อเคลียร์คุกกี้/Storage และพาไปหน้า Login
      this.authService.logout();
    }
  }

  onChangePassword(): void {
    this.router.navigate(['/changePassword']); 
  }

  goBack() {
    window.history.back();
  }
}