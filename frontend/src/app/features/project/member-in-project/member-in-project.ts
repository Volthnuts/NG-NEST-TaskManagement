import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../../shared/shared-modules';

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-member-in-project',
  imports: [
    SharedModule
  ],
  templateUrl: './member-in-project.html',
  styleUrl: './member-in-project.scss',
})
export class MemberInProject implements OnInit {
  projectId: string | null = null;
  
  // ตัวแปรสำหรับช่องค้นหาผู้ใช้เพื่อกดแอด
  searchUserQuery = '';

  // รายชื่อคนในโปรเจกต์ปัจจุบัน (Dummy)
  members: MemberItem[] = [
    { id: 'user-1', name: 'Alex Rivers', email: 'alex.r@company.com', role: 'OWNER', joinedAt: '2026-01-15' },
    { id: 'user-2', name: 'Sarah Connor', email: 'sarah.c@company.com', role: 'MEMBER', joinedAt: '2026-02-20' }
  ];

  // 💡 จำลองฐานข้อมูลผู้ใช้ทั้งหมดในระบบ (ที่ดึงมาจาก NestJS หลังบ้าน)
  allSystemUsers: SystemUser[] = [
    { id: 'user-1', name: 'Alex Rivers', email: 'alex.r@company.com' },
    { id: 'user-2', name: 'Sarah Connor', email: 'sarah.c@company.com' },
    { id: 'user-3', name: 'John Doe', email: 'john.d@company.com' },
    { id: 'user-4', name: 'Emma Watson', email: 'emma.w@company.com' },
    { id: 'user-5', name: 'Michael Scott', email: 'michael.s@company.com' }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
  }

  onBack() {
    window.history.back();
  }
  
  // 💡 ฟังก์ชันกรองรายชื่อผู้ใช้ทั้งหมดในระบบตามคีย์เวิร์ดที่ค้นหา
  get filteredSystemUsers(): SystemUser[] {
    if (!this.searchUserQuery.trim()) {
      return this.allSystemUsers; // ถ้าไม่ได้พิมพ์อะไร ให้แสดงทั้งหมดเลย
    }
    return this.allSystemUsers.filter(user => 
      user.name.toLowerCase().includes(this.searchUserQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchUserQuery.toLowerCase())
    );
  }

  // 💡 ฟังก์ชันเช็กว่าผู้ใช้คนนี้ "เป็นสมาชิกในโปรเจกต์อยู่แล้วหรือยัง"
  isAlreadyMember(userId: string): boolean {
    return this.members.some(member => member.id === userId);
  }

  // 💡 ฟังก์ชันกดเพิ่มผู้ใช้เข้าโปรเจกต์
  addMemberToProject(user: SystemUser) {
    if (this.isAlreadyMember(user.id)) return;

    // เพิ่มเข้าไปเป็น MEMBER เริ่มต้นก่อน
    this.members.push({
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'MEMBER',
      joinedAt: new Date().toISOString().split('T')[0]
    });
    
    console.log(`Added User ID: ${user.id} to Project ID: ${this.projectId}`);
    // TODO: ยิง API ไประบุในตาราง ProjectMember หลังบ้าน
  }

  // 💡 ฟังก์ชันเปลี่ยนสิทธิ์ (โดยเฉพาะเงื่อนไข OWNER ได้คนเดียวต่อโปรเจกต์)
  onChangeRole(memberId: string, newRole: 'OWNER' | 'MEMBER') {
    if (newRole === 'OWNER') {
      const confirmTransfer = confirm('Are you sure you want to change the Project Owner? You (or the current owner) will be demoted to Member.');
      
      if (!confirmTransfer) return;

      // กฎเหล็ก: วนลูปเปลี่ยนทุกคนในโปรเจกต์ให้เป็น MEMBER ทั้งหมดก่อน เพื่อล้างสิทธิ์ Owner เก่าออก
      this.members = this.members.map(member => ({
        ...member,
        role: member.id === memberId ? 'OWNER' : 'MEMBER' // สิทธิ์ OWNER จะตกไปอยู่ที่คนใหม่คนเดียวเท่านั้น
      }));

      console.log(`Transferred Project Ownership to User ID: ${memberId}`);
      // TODO: หลังบ้านต้องทำ Transaction แก้สิทธิ์ Owner เก่าให้เป็น Member และตั้งคนนี้เป็น Owner ใหม่
    } else {
      // กรณีเปลี่ยนจาก OWNER เป็น MEMBER ตรงๆ (ต้องเช็กไม่ให้โปรเจกต์ขาด Owner)
      const currentOwner = this.members.find(m => m.id === memberId && m.role === 'OWNER');
      if (currentOwner) {
        alert('Every project must have at least one Owner. Please assign another user as Owner first.');
        return;
      }
    }
  }

  onRemoveMember(memberId: string) {
    const member = this.members.find(m => m.id === memberId);
    if (member?.role === 'OWNER') {
      alert('Cannot remove the Project Owner.');
      return;
    }

    if (confirm('Are you sure you want to remove this member?')) {
      this.members = this.members.filter(m => m.id !== memberId);
    }
  }
}