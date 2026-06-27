import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared-modules';
import { ActivatedRoute, Router } from '@angular/router';

interface TaskDetail {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  creatorId: string;   // 💡 เพิ่มมาเพื่อใช้เช็กสิทธิ์ภายหลัง
  assigneeId: string; // 💡 เพิ่มมาเพื่อใช้เช็กสิทธิ์ภายหลัง
}

@Component({
  selector: 'app-edit-task',
  imports: [
    SharedModule
  ],
  templateUrl: './edit-task.html',
  styleUrl: './edit-task.scss',
})
export class EditTask implements OnInit {
  taskId: string | null = null;
  
  // 💡 ตัวแปรควบคุมสิทธิ์: ปัจจุบันให้เป็น true ไปก่อน ค่อยเอาไปดักเช็กกับ ID ของผู้ใช้ที่ Login ทีหลัง
  hasPermission = true; 
  
  // 💡 ตัวแปรสลับโหมด: ถ้าระบบเปิดมาจะให้ดูอย่างเดียวก่อน (Read-only) จนกว่าจะกดปุ่ม "Edit"
  isEditMode = false;

  // ข้อมูล Task หลัก
  task: TaskDetail = {
    id: 'task-2',
    title: 'Setup NestJS Backend Framework & Prisma DB',
    description: 'Configure PostgreSQL datasource, generate client, and map initial models.',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    dueDate: '2026-06-28',
    creatorId: 'user-owner-123',
    assigneeId: 'user-current-456'
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.taskId = this.route.snapshot.paramMap.get('taskId');
    
    // 💡 สไตล์การเช็กสิทธิ์ในอนาคต:
    // const currentUserId = this.authService.getUserId();
    // this.hasPermission = (currentUserId === this.task.creatorId || currentUserId === this.task.assigneeId);
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
  }

  onSubmit() {
    if (!this.task.title.trim()) return;
    
    console.log('Sending Updated Task to NestJS:', this.task);
    // TODO: ยิง API อัปเดตข้อมูลเสร็จแล้วปิดโหมดแก้ไข
    this.isEditMode = false;
  }

  onDelete() {
    if (confirm(`Are you sure you want to delete this task?`)) {
      console.log('API Delete Call for Task ID:', this.taskId);
      this.goBack();
    }
  }

  goBack() {
    window.history.back();
  }
}