import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared-modules';
import { ApiService } from '../../../core/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectStateService } from '../../../shared/project-state.service';
import { LoadingPage } from '../../../shared/loading-page/loading-page';

@Component({
  selector: 'app-project-task-list',
  standalone: true,
  imports: [
    SharedModule,
    LoadingPage
  ],
  templateUrl: './project-task-list.html',
  styleUrl: './project-task-list.scss',
})
export class ProjectTaskList implements OnInit {
  isLoading = true; // ตัวแปรควบคุมการแสดง Loading Spinner

  // ประกาศตัวแปรตัวนี้เพิ่มเข้าไป เพื่อส่ง Math เข้าไปให้ HTML รู้จักครับ
  protected readonly Math = Math;

  tasks: any[] = [];
  projectId!: string;

  searchQuery = '';
  statusFilter = 'ALL';

  // ระบบ Sorting
  // ทิศทางการเรียง: 'asc' = น้อยไปมาก/ใกล้สุด, 'desc' = มากไปน้อย/ไกลสุด, 'none' = ไม่เรียงตามคอลัมน์นี้
  sortColumn: 'dueDate' | 'priority' | 'none' = 'none';
  sortDirection: 'asc' | 'desc' = 'asc';

  // ระบบ Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private projectState: ProjectStateService,
    private router: Router
  ) {}
   
  ngOnInit(): void {
    this.projectState.currentProject$.subscribe(project => {
      if (project) {
        this.projectId = project.id;
        this.getProjectDetail(project.id);
      }
    });
  }

  // ฟังก์ชันสลับการจัดเรียงเมื่อคลิกที่หัวคอลัมน์
  toggleSort(column: 'dueDate' | 'priority') {
    if (this.sortColumn === column) {
      // ถ้ากดคอลัมน์เดิม ให้สลับทิศทาง asc -> desc -> none
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else {
        this.sortColumn = 'none';
      }
    } else {
      // ถ้ากดคอลัมน์ใหม่ ให้เริ่มที่ asc
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1; // เปลี่ยนการเรียงให้รีเซ็ตกลับไปหน้า 1
  }

  // ฟังก์ชันคำนวณลำดับความสำคัญ (Priority Weight) เพื่อใช้ในการเปรียบเทียบ
  private getPriorityWeight(priority: string): number {
    switch (priority) {
      case 'URGENT': return 4;
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  }

  // ฟังก์ชันคำนวณลำดับสถานะงาน (Status Weight) เพื่อให้ OPEN ขึ้นก่อนเสมอ
  private getStatusWeight(status: string): number {
    switch (status) {
      case 'OPEN': return 1;
      case 'IN_PROGRESS': return 2;
      case 'DONE': return 3;
      default: return 4;
    }
  }

  // ฟังก์ชันคำนวณ กรอง เรียง และตัดแบ่งหน้าเพื่อแสดงผล
  get filteredTasks(): any[] {
    // 1. Filter ข้อมูลตามช่องค้นหาและสวิตช์สถานะก่อน
    let result = this.tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            (task.description && task.description.toLowerCase().includes(this.searchQuery.toLowerCase()));
      const matchesStatus = this.statusFilter === 'ALL' || task.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });

    // อัปเดตจำนวนไอเทมทั้งหมดหลังกรอกตัวกรองเสร็จ (เอาไว้คำนวณหน้าของ Pagination)
    this.totalItems = result.length;

    // 2. Sort ข้อมูล
    result.sort((a, b) => {
      // กฎข้อที่ 1 (สำคัญที่สุดตามที่คุณขอ): เรียงตามลำดับสถานะงานเสมอ (OPEN -> IN_PROGRESS -> DONE)
      const statusA = this.getStatusWeight(a.status);
      const statusB = this.getStatusWeight(b.status);
      if (statusA !== statusB) {
        return statusA - statusB; // ค่าน้อย (OPEN = 1) จะขึ้นก่อนค่ามากเสมอ
      }

      // กฎข้อที่ 2: ถ้าสถานะเหมือนกัน ให้ดูว่ามี Custom Sort จากหัวตารางไหม
      if (this.sortColumn === 'dueDate') {
        // จัดการกรณีไม่มี Due Date ให้ไปอยู่ล่างสุด
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && !b.dueDate) return 0;

        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (this.sortColumn === 'priority') {
        const weightA = this.getPriorityWeight(a.priority);
        const weightB = this.getPriorityWeight(b.priority);
        return this.sortDirection === 'asc' ? weightB - weightA : weightA - weightB; // asc: ด่วนสุดขึ้นก่อน
      }

      // กฎข้อที่ 3: ถ้าไม่มีการคลิกเรียงตามคอลัมน์ ให้ใช้ Default เดิม (ไม่มีคนรับผิดชอบขึ้นก่อน)
      const aHasAssignee = !!a.assignee;
      const bHasAssignee = !!b.assignee;
      if (!aHasAssignee && bHasAssignee) return -1;
      if (aHasAssignee && !bHasAssignee) return 1;

      return 0;
    });

    // 3. Pagination: ตัดก้อนอาเรย์แบ่งส่งออกไปทีละ 10 ชิ้น
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return result.slice(startIndex, startIndex + this.pageSize);
  }

  // คำนวณหาจำนวนหน้าทั้งหมด
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  getProjectDetail(id: string) {
    this.isLoading = true; // เปิด Loading Spinner ขณะรอดึงข้อมูล
    this.apiService.get<any>(`/${id}/tasks`).subscribe({
      next: (res) => {
        this.tasks = res;
        this.currentPage = 1; // โหลดข้อมูลชุดใหม่ให้กลับมารอที่หน้าแรก
        this.isLoading = false; // ปิด Loading Spinner หลังจากดึงข้อมูลเสร็จ
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching project detail:', err);
      }
    });
  }

  // สลับหน้าใน Pagination
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }

  // รีเซ็ตเลขหน้าเวลาที่ผู้ใช้พิมพ์ค้นหาใหม่
  onSearchChange() {
    this.currentPage = 1;
  }

  openCreateTask() {
    this.router.navigate(['/workspace', this.projectId, 'tasks', 'create']);
  }

  editTask(taskId: string) {
    this.router.navigate(['/workspace', this.projectId, 'tasks', 'edit', taskId]);
  }
}