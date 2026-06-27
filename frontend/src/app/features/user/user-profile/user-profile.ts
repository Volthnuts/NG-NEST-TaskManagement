import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared-modules';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';   // 💡 อิมพอร์ตเพิ่ม
import { AuthService } from '../../../core/auth/auth.service';   // 💡 อิมพอร์ตเพิ่ม

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

  // 💡 ฉีด Services ทั้งหมดเข้ามาใช้งานในนี้ให้ถูกต้อง
  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // 💡 1. ดึง ID ของตัวเราเองจากระบบ Auth
    this.currentUserId = this.authService.getUserId();

    // 💡 2. ดึงรหัส userId จากพารามิเตอร์ URL 
    this.profileId = this.route.snapshot.paramMap.get('userId');
    
    // 💡 3. เช็กสิทธิ์เบื้องต้น: ถ้า URL ชี้มาที่ไอดีเรา แปลว่าเป็นเจ้าของโปรไฟล์
    this.isOwnProfile = (this.profileId === this.currentUserId);

    // ⚡ 4. ยิง API โหลดข้อมูลโปรไฟล์ของไอดีนี้จากหลังบ้าน
    if (this.profileId) {
      this.loadUserProfile(this.profileId);
    }
  }

  loadUserProfile(id: string) {
    this.apiService.get<UserProfileInterface>(`/user/${id}`).subscribe({
      next: (data) => {
        this.user = data;
        // เช็กสิทธิ์อีกครั้งเพื่อความชัวร์จากข้อมูลที่ได้มาจาก DB หลังบ้าน
        this.isOwnProfile = (this.user.id === this.currentUserId);
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

    // 💡 ย้ายโลจิกมาอยู่ข้างใน onSubmit ให้ถูกต้องตามโครงสร้างภาษา
    this.apiService.put<any>(`/user/update`, formData).subscribe({
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
          this.user.bio = res.bio;
        }
      },
      error: (err) => {
        alert(err.error?.message || 'ไม่สามารถอัปเดตข้อมูลได้');
      }
    });
  }

  onLogout() {
    if (confirm('Are you sure you want to log out?')) {
      // ⚡ ใช้ฟังก์ชัน logout ของ AuthService เพื่อเคลียร์คุกกี้/Storage และพาไปหน้า Login
      this.authService.logout();
    }
  }

  goBack() {
    window.history.back();
  }
}