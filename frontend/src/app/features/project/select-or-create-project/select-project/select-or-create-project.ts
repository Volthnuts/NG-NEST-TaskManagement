import { ChangeDetectorRef, Component, OnInit } from '@angular/core'; // 1. อิมพอร์ต OnInit
import { SharedModule } from '../../../../shared/shared-modules';
import { ApiService } from '../../../../core/services/api.service'; // 2. อิมพอร์ต ApiService ของคุณ
import { CreateProject } from '../create-project/create-project';
import { Router } from '@angular/router';
import { ProjectStateService } from '../../../../shared/project-state.service';
import { LoadingPage } from '../../../../shared/loading-page/loading-page';

interface ProjectSpace {
  id: string;
  name: string;
  description: string;
  role: 'OWNER' | 'MEMBER';
  memberCount: number;
  avatarUrl?: string;
}

@Component({
  selector: 'app-select-or-create-project',
  imports: [
    SharedModule,
    CreateProject,
    LoadingPage
  ],
  templateUrl: './select-or-create-project.html',
  styleUrl: './select-or-create-project.scss',
})
export class SelectOrCreateProject implements OnInit { // 3.อิมพลีเมนต์ OnInit
  currentView: 'LIST' | 'CREATE' = 'LIST';
  isLoading = false; // สำหรับทำสถานะโหลดดิ้งหน้าโปรเจกต์

  // 4. เปลี่ยนจากข้อมูลจำลองเดิม ให้เริ่มต้นเป็นอาเรย์ว่างเปล่าเพื่อรอรับจาก API
  projectSpaces: ProjectSpace[] = [];

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    // private projectState: ProjectStateService
  ) { } // 5. ฉีด ApiService เข้ามาใช้งาน

  ngOnInit(): void {
    this.loadProjects(); // 6. โหลดข้อมูลตั้งแต่เริ่มเปิดหน้าจอ
  }

  // 7. ฟังก์ชันสำหรับดึงข้อมูลจาก API และ Format ข้อมูล
  loadProjects() {
    this.isLoading = true;
    
    this.apiService.get<any[]>('/projects').subscribe({
      next: (res) => {
        this.isLoading = false;
        
        // แปลงโครงสร้างข้อมูล (Mapping) 
        this.projectSpaces = res.map((proj: any) => ({
          id: proj.id,
          name: proj.name,
          description: proj.description,
          // ดึงสิทธิ์จากสมาชิกตัวแรกในอาเรย์ ถ้าไม่มีให้ Default เป็น MEMBER
          role: proj.members && proj.members.length > 0 ? proj.members[0].role : 'MEMBER',
          // ดึงจำนวนสมาชิกจากก้อน _count.members ของ NestJS
          memberCount: proj._count?.members || 1
        }));

        // ส่งข้อมูลโปรเจกต์นี้ (รวมชื่อโปรเจกต์) ขึ้นไปอัปเดตที่ Service เพื่อให้ Navbar เห็น
        // this.projectState.setAllProjects(this.projectSpaces);

        this.cdr.detectChanges();
        // console.log('Formatted Projects:', this.projectSpaces);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading projects:', err);
        alert(err.error?.message || 'Cannot load projects.');
      }
    });
  }

  selectSpace(projectId: string) {
    console.log('Navigating to space:', projectId);
    // วิ่งพุ่งตรงไปที่หน้า workspace/tasks พร้อมแนบ id โปรเจกต์ต่อท้าย URL เช่น /workspace/tasks/fbd1e8b1-...
    this.router.navigate(['/workspace', projectId, 'tasks']);
  }

  openCreateForm() {
    this.currentView = 'CREATE';
  }

  backToList() {
    this.currentView = 'LIST';
  }

  // 8. ปรับฟังก์ชันเซฟข้อมูลให้ยิงเข้า API หลังบ้านจริง
  handleProjectCreation(newSpace: { name: string; description: string }) {
    this.isLoading = true;
    console.log('Saving to NestJS:', newSpace);

    this.apiService.post<any>('/projects/create', newSpace).subscribe({
      next: (res) => {
        // เมื่อสร้างโปรเจกต์ที่หลังบ้านสำเร็จ ให้สั่งรีโหลดข้อมูลใหม่ทั้งหมดเพื่อให้ได้ค่าล่าสุด
        this.loadProjects();
        this.backToList();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error creating project:', err);
        alert(err.error?.message || 'Failed to create project.');
      }
    });
  }
}