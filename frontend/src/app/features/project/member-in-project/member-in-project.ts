import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../../shared/shared-modules';
import { ApiService } from '../../../core/services/api.service';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { LoadingPage } from '../../../shared/loading-page/loading-page';

@Component({
  selector: 'app-member-in-project',
  imports: [
    SharedModule,
    LoadingPage
  ],
  templateUrl: './member-in-project.html',
  styleUrl: './member-in-project.scss',
})
export class MemberInProject implements OnInit {
  projectId: string | null = null;

  // ตัวแปรสำหรับช่องค้นหาผู้ใช้เพื่อกดแอด
  searchControl = new FormControl('')

  // รายชื่อคนในโปรเจกต์ปัจจุบัน 
  members: any[] = [];

  currentUser: any;
  isLoading = true;
  isOwner = false;

  // ตัวแปรคุมสถานะ Infinite Scroll ยิงหาหลังบ้าน
  filteredSystemUsers: any[] = []; // รายชื่อผู้ใช้ระบบที่หลุดมาจาก API หลังบ้าน
  currentPage = 1;
  limit = 15; // จำกัดรอบละ 15 คน
  isLoadingUsers = false;
  hasMoreUsers = true;

  private searchSub!: Subscription;
  
  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.parent?.paramMap.get('projectId') || '';
    this.currentUser = JSON.parse(localStorage.getItem('current_user') || '{}'); // ดึง ID ของผู้ใช้ที่ Login เข้ามา

    // 1. โหลดรายชื่อสมาชิกที่เป็นอยู่ปัจจุบันในโปรเจกต์นี้ก่อน
    this.loadCurrentMembers();

    // 2. โหลดผู้ใช้ทั้งระบบรอบแรก (สแตนด์บาย 15 คนแรก)
    this.loadSystemUsers();

    // ** ใช้ DebounceTime หน่วงเวลาพิมพ์ค้นหา 300ms ค่อยยิง API ไปหลังบ้าน
    this.searchSub = this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      // เมื่อคำค้นหาเปลี่ยน ให้รีเซ็ตหน้ากลับไปนับ 1 ใหม่
      this.currentPage = 1;
      this.filteredSystemUsers = [];
      this.hasMoreUsers = true;
      this.loadSystemUsers(value || '');
    });
  }

  ngOnDestroy(): void {
    if (this.searchSub) this.searchSub.unsubscribe();
  }

  loadCurrentMembers() {
    this.isLoading = true;
    // เรียก API สมาชิกปัจจุบันของโปรเจกต์ เช่น /projects/:id/members
    this.apiService.get<any>(`/projects/${this.projectId}/members`).subscribe({
      next: (res) => {
        this.members = res;
        this.isLoading = false;
        console.log('this.members ',this.members)

        // output เป็นแบบนี้
        // [                            ลูป array ก้อนใหญ่
        //   {                          มาที่ array[x].id เอามาเช็คหาว่ามีตรงมั้ยจาก some
        //     "id": "...", 
        //     "name": "...",
        //     "email": "...",
        //     "projects": [{           มาที่ array[x].project[0] เพราะ project มีไอเท็มแค่อันเดียว
        //       "createdAt": "..."
        //       "role": "OWNER"        ไปที่ array[x].project[0].role
        //     }]
        //   }
        // ]

        // ลอจิกเช็กสิทธิ์: ค้นหาใน Array (res) ว่ามีตัวเราที่มี role เป็น OWNER ไหม
        if (this.currentUser && this.currentUser.id) {
          this.isOwner = res.some((member: any) => 
            (member.id === this.currentUser.id) && (member.projects[0]?.role === 'OWNER')
            // เช็คว่า : วนหาใน array ว่า array[x].id == currentUser.id AND array[x].projects[0].role == OWNER 
            // คือถ้า true คู่ แสดงว่าเป็น owner ของโปรเจค
          );
        }
        console.log('current owner: ', this.isOwner)
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching project detail:', err);
      }
    });
  }

  // ฟังก์ชันโหลดผู้ใช้ระบบพ่วง Pagination + Search
  loadSystemUsers(searchQuery: string = this.searchControl.value || ''): void {
    if (this.isLoadingUsers || !this.hasMoreUsers) return;

    this.isLoadingUsers = true;

    // ยิง API เส้นที่เราปรับปรุงลอจิกหลังบ้านไว้
    const url = `?page=${this.currentPage}&limit=${this.limit}&search=${searchQuery}`;
    
    this.apiService.get<any[]>(`/projects/${this.projectId}/users${url}`).subscribe({
      next: (res) => {
        console.log('allUsers ', res)
        if (res.length < this.limit) {
          this.hasMoreUsers = false; // ถ้าส่งมาไม่เต็ม limit แปลว่าหมดคลังแล้ว
        }
        
        // เอาสมาชิกใหม่ที่เพิ่งได้ ไปต่อท้ายสมาชิกรอบเก่า
        this.filteredSystemUsers = [...this.filteredSystemUsers, ...res];
        this.isLoadingUsers = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoadingUsers = false;
      }
    });
  }

  // ฟังก์ชันตรวจจับการ Scroll หน้าจอลงมาล่างสุดเพื่อเบิ้ลหน้า
  onUsersScroll(event: any): void {
    const element = event.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 5;

    if (isAtBottom && !this.isLoadingUsers && this.hasMoreUsers) {
      this.currentPage++;
      this.loadSystemUsers();
    }
  }

  onBack() {
    window.history.back();
  }

  // ลอจิกอื่น ๆ (isAlreadyMember, addMemberToProject, onChangeRole, onRemoveMember) 
  isAlreadyMember(userId: string): boolean {
    // ใน allMember in System ทุกๆลูปจะโยน id ไปเช็คใน member เสมอ
    // ตอนกดเพิ่มสมาชิกและ reload this.loadCurrentMembers() ตัว this.members จะเปลี่ยนค่า เพราะมีการเรียกใช้ cdr.detectChanges
    // ตัวนี้ก็จะไปเรียกถูกเรียกใหม่และเปลี่ยนสถานะที่แสดงใน allUser ตามเงื่อนไข
    return this.members.some(member => member.id === userId);
  }

  addMemberToProject(userId: string) {
    this.isLoading = true;
    this.apiService.post<any>(`/projects/${this.projectId}/add-member`, { memberId: userId }).subscribe({
      next: (res) => {
        console.log('Added member successfully:', res);
        this.isLoading = false;
        this.loadCurrentMembers()
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error adding member :', err);
        alert(err.error?.message || 'Failed to add member. Please try again.');
      }
    });
  }

  onChangeRole(memberId: string, newRole: 'OWNER' | 'MEMBER') {
    this.isLoading = true;
    if (newRole === 'OWNER') {
      const confirmTransfer = confirm('Are you sure you want to change the Project Owner?');
      if (!confirmTransfer) {
        this.loadCurrentMembers();
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      }
      console.log('memberid ', memberId)
      const body = { 
        memberId: memberId, 
        ownerId: this.currentUser.id 
      };
      this.apiService.put<any>(`/projects/${this.projectId}/change-owner`, body).subscribe({
        next: (res) => {
          console.log('Change Owner successfully:', res);
          this.isLoading = false; // ปิด Loading Spinner หลังจากอัปเดตเสร็จ
          this.loadCurrentMembers();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false; // ปิด Loading Spinner ถ้าเกิดข้อผิดพลาด
          console.error('Error updating task:', err);
          alert(err.error?.message || 'Failed to update task. Please try again.');
        }
      });
    } else {
      this.isLoading = false;
      const currentOwner = this.members.find(m => m.id === memberId && m.role === 'OWNER');
      // เป็นการเช็กเงื่อนไขว่า คนที่เรากำลังจะคลิกเปลี่ยนสิทธิ์เนี่ย id ตรงกับคนที่คลิกเลือกไหม และ ปัจจุบันเขามีตำแหน่งเป็น OWNER อยู่หรือเปล่า
      // ถ้าเรากำลังพยายามกดเปลี่ยนสิทธิ์ของคนที่เป็น Owner อยู่ ตัวแปร currentOwner จะมีข้อมูลทันที
      if (currentOwner) {
        alert('Every project must have at least one Owner.');
        return;
      }
    }
  }

  onRemoveMember(memberId: string) {
    this.isLoading = true;
    if (confirm('Are you sure you want to remove this member?')) {
      this.apiService.delete<any>(`/projects/${this.projectId}/delete-member/${memberId}`).subscribe({
        next: (res) => {
          this.isLoading = false;
          console.log('Deleted member successfully:', res);
          this.loadCurrentMembers()
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error deleting member :', err);
          alert(err.error?.message || 'Failed to delete member. Please try again.');
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  // สร้าง Getter สำหรับจัดเรียงข้อมูลสมาชิกก่อนส่งไปวาดบน HTML
  get sortedMembers(): any[] {
    if (!this.members || this.members.length === 0) return [];

    // ใช้การ [...this.members] เพื่อ Clone ค่าออกมาเรียง ป้องกันการไปกวน Array ต้นฉบับโดยตรง
    return [...this.members].sort((a, b) => {
      const aRole = a.projects?.[0]?.role === 'OWNER' ? 1 : 0;
      const bRole = b.projects?.[0]?.role === 'OWNER' ? 1 : 0;

      // 🎯 เงื่อนไขที่ 1: ดัน OWNER ขึ้นก่อน (ถ้า Role ต่างกัน ให้ตัวที่เป็น OWNER ขึ้นก่อน)
      if (aRole !== bRole) {
        return bRole - aRole; 
      }

      // 🎯 เงื่อนไขที่ 2: ถ้า Role เหมือนกัน ให้เรียงตามชื่อตัวอักษร A-Z
      const aName = a.name || '';
      const bName = b.name || '';
      return aName.localeCompare(bName, 'th', { sensitivity: 'base' });
    });
  }
}