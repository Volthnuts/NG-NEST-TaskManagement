import { ChangeDetectorRef, Component } from '@angular/core';
import { SharedModule } from '../../shared-modules';
import { ProjectStateService } from '../../project-state.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  imports: [
    SharedModule
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  currentProject: any = null;
  allProjects: any[] = [];
  isProjectDropdownOpen = false;   // ตัวแปรควบคุมการเปิด-ปิด Dropdown โปรเจกต์
  currentUser: any;

  constructor(
    private projectState: ProjectStateService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}
  
  ngOnInit(): void {    
    // // ติดตามชื่อโปรเจกต์ปัจจุบัน
    // this.projectState.currentProject$.subscribe(project => {
    //   this.currentProject = project;
    //   console.log('Main Layout Current Project Updated:', project);
    // });

    // // ติดตามรายชื่อโปรเจกต์ทั้งหมดเพื่อแสดงใน Dropdown
    // this.projectState.allProjects$.subscribe(projects => {
    //   this.allProjects = projects;
    //   console.log('Main Layout All Projects Updated:', projects);
    // });
    this.currentUser = JSON.parse(localStorage.getItem('current_user') || '{}'); // ดึง ID ของผู้ใช้ที่ Login เข้ามา

    this.loadAllProjectsForDropdown(); // 1. โหลดรายชื่อโปรเจกต์ทั้งหมดมาสแตนด์บายรอไว้ที่ Dropdown ทันทีที่เข้าหน้านี้

    // 2. จับตาดูพารามิเตอร์ URL: ดึง projectId ตั้งแต่เริ่มเข้าหน้าจอครั้งแรก
    this.fetchProjectFromCurrentRoute();

    // 3. (สำคัญมาก) เฝ้าฟังเวลามีการกดสลับโปรเจกต์ผ่าน Dropdown เพื่อยิง API อัปเดตข้อมูลใหม่
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.fetchProjectFromCurrentRoute();
    });
  }

  private fetchProjectFromCurrentRoute() {
    // ดึงตรงๆ จาก ActivatedRoute ของตัวมันเอง
    let projectId = this.route.snapshot.paramMap.get('projectId');

    if (projectId) {
      this.loadProjectDetail(projectId);
    }
  }

  // ยิง API ดึงข้อมูลรายละเอียดของโปรเจกต์ที่เปิดอยู่ตอนนี้
  loadProjectDetail(id: string) {
    this.apiService.get<any>(`/projects/${id}`).subscribe({
      next: (res) => {
        // console.log('Layout: Loaded project detail from API:', res);
        this.currentProject = res;
        // ส่งข้อมูลไปอัปเดตแชร์ให้คอมโพเนนต์อื่น (เช่น ProjectTaskList) รู้ด้วย
        this.projectState.setCurrentProject(res);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Layout: Error loading project data', err);
      }
    });
  }

  // ยิง API โดด ๆ ดึงรายการโปรเจกต์ทั้งหมดมาใส่ตู้ Dropdown
  loadAllProjectsForDropdown() {
    this.apiService.get<any[]>('/projects').subscribe({
      next: (res) => {
        this.allProjects = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Layout: Error loading workspaces', err);
      }
    });
  }

  toggleProjectDropdown() {
    this.isProjectDropdownOpen = !this.isProjectDropdownOpen;
  }

  closeProjectDropdown() {
    this.isProjectDropdownOpen = false;
  }

  // ฟังก์ชันจัดการ Action ต่างๆ ของโปรเจกต์
  switchProject(project: any) {
    this.currentProject = project;
    this.closeProjectDropdown();
    console.log('Switched to project:', project.name);
    // เปลี่ยนหน้า หรือโหลดข้อมูลของโปรเจกต์นี้ใหม่
    this.router.navigate(['/workspace', project.id, 'tasks']); // แนะนำแก้เป็นแบบ Array ปลอดภัยกว่า
  }

  editProject(projectId: string, event: Event) {
    event.stopPropagation(); // กันไม่ให้ไปคลิกโดนตัวสลับโปรเจกต์
    this.closeProjectDropdown();
    console.log('Navigating to edit project ID:', projectId);
    this.router.navigate([`/workspace/${projectId}/edit`]);
  }

  viewMembers(projectId: string, event: Event) {
    event.stopPropagation();
    this.closeProjectDropdown();
    console.log('Navigating to members list for project ID:', projectId);
    this.router.navigate([`/workspace/${projectId}/members`]);
  }

  // ฟังก์ชันสำหรับหาอักษรตัวแรกของ Email มาทำเป็นพิมพ์ใหญ่
  get firstLetter(): string {
    if (this.currentUser && this.currentUser.email) {
      return this.currentUser.email.charAt(0).toUpperCase();
    }
    return 'U'; // ค่าเริ่มต้นกรณีไม่มีข้อมูล (User)
  }

  // ฟังก์ชันคลิกแล้วย้ายหน้าโดยใช้ ID ของ User ปัจจุบัน
  goToProfile(): void {
    // แก้ไข: ดึง projectId จากตัวแปรที่ Layout มีอยู่แล้ว ถ้าไม่มี ค่อยถอยไปเช็กที่ URL
    let projectId = this.currentProject?.id || this.route.snapshot.paramMap.get('projectId') || '';
    
    if (this.currentUser && this.currentUser.id && projectId) {
      // แก้ไข: ตรวจสอบก่อนว่า URL ปัจจุบันไม่ใช่หน้าโปรไฟล์เดิมอยู่แล้ว เพื่อป้องกันการกดย้ำซ้ำซ้อน
      const targetUrl = `workspace/${projectId}/user/my-profile`;
      if (this.router.url !== targetUrl) {
        this.router.navigate([targetUrl]); 
      }
    } else {
      console.warn('Cannot navigate to profile: Missing projectId or currentUser');
    }
  }
}
