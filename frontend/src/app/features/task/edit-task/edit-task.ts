import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared-modules';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingPage } from '../../../shared/loading-page/loading-page';

@Component({
  selector: 'app-edit-task',
  imports: [
    SharedModule,
    LoadingPage
  ],
  templateUrl: './edit-task.html',
  styleUrl: './edit-task.scss',
})
export class EditTask implements OnInit {
  editTaskForm!: FormGroup;

  taskId: string | null = null;
  projectId: string | null = null;
  currentUser: any; // ตัวแปรเก็บ ID ของผู้ใช้ที่ Login เข้ามา
  assignee: any[] = [];

  hasPermission = false;  // ตัวแปรควบคุมสิทธิ์: ปัจจุบันให้เป็น true ไปก่อน ค่อยเอาไปดักเช็กกับ ID ของผู้ใช้ที่ Login ทีหลัง
  isEditMode = false;  // ตัวแปรสลับโหมด: ถ้าระบบเปิดมาจะให้ดูอย่างเดียวก่อน (Read-only) จนกว่าจะกดปุ่ม "Edit"
  isLoading = true; // ตัวแปรควบคุมการแสดง Loading Spinner
  canDelete = false; // ตัวแปรควบคุมการแสดงปุ่ม Delete

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.editTaskForm = this.fb.group({
      title: ['', [Validators.required, Validators.pattern(/.*\S.*/)]], // ห้ามเว้นว่าง/เคาะ Spacebar รัวๆ
      description: [''],
      priority: ['MEDIUM', Validators.required],
      dueDate: [''],
      assigneeId: [''],
      status: ['OPEN', Validators.required]
    });
    this.editTaskForm.disable(); // ปิดฟอร์มให้เป็น Read-only จนกว่าจะกดปุ่ม Edit

    // หยิบจากตัวเอง (เพราะ :taskId อยู่ในสเปซตัวเอง)
    this.taskId = this.route.snapshot.paramMap.get('taskId') || '';

    // ต้องใส่ .parent?. เพื่อปีนขึ้นไปหยิบ :projectId จาก parent route
    this.projectId = this.route.snapshot.parent?.paramMap.get('projectId') || '';

    this.currentUser = JSON.parse(localStorage.getItem('current_user') || '{}'); // ดึง ID ของผู้ใช้ที่ Login เข้ามา

    this.loadTaskDetails();

    // assignee array ดึงค่าจาก api
    this.apiService.get<string[]>(`/projects/${this.projectId}/users`).subscribe({
      next: (res) => {
        this.assignee = res;
        console.log('Fetched assignees:', this.assignee);
        this.isLoading = false; // ปิด Loading Spinner หลังจากดึงข้อมูลเสร็จ
        this.cdr.detectChanges(); // แจ้ง Angular ให้ตรวจสอบการเปลี่ยนแปลง
      },
      error: (err) => {
        console.error('Error fetching assignees:', err);
        this.isLoading = false; // ปิด Loading Spinner ถ้าเกิดข้อผิดพลาด
      }
    });
  }

  loadTaskDetails(): void {
    this.isLoading = true; // เปิด Loading Spinner ขณะรอดึงข้อมูล
    this.editTaskForm.disable(); // ล็อกฟอร์มไว้ก่อนระหว่างรอดึงค่าใหม่
    this.apiService.get<any>(`/${this.projectId}/tasks/${this.taskId}`).subscribe({
      next: (res) => {
        console.log('Fetched Task Detail:', res);
        this.editTaskForm.patchValue({
          title: res.title,
          description: res.description,
          priority: res.priority || 'MEDIUM',
          dueDate: res.dueDate ? res.dueDate.substring(0, 10) : '', //res.dueDate,
          assigneeId: res.assigneeId || (res.assignee ? res.assignee.id : ''), // ดักเผื่อหลังบ้านส่งมาเป็น Object หรือ ID
          status: res.status || 'OPEN'
        });

        const isCreatorOrAssignee = this.currentUser && (this.currentUser.id === res.createdById || this.currentUser.id === res.assigneeId);
        this.canDelete = this.currentUser && (this.currentUser.id === res.createdById); // เงื่อนไขให้ลบได้เฉพาะคนสร้างงานเท่านั้น

        if(isCreatorOrAssignee) {
          this.hasPermission = true;
        }else{
          this.hasPermission = false;
        }
        this.isLoading = false; // ปิด Loading Spinner หลังจากดึงข้อมูลเสร็จ
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching task details:', err);
        alert(err.error?.message || 'Failed to fetch task detail.');
      }
    });
  }

  toggleEditMode(): void {
    this.loadTaskDetails();
    if (!this.hasPermission) return; // กันเหนียว ถ้าไม่มีสิทธิ์ห้ามทำอะไร

    this.isEditMode = !this.isEditMode;

    if (this.isEditMode) {
      this.editTaskForm.enable();  // เปิดฟอร์มให้พิมพ์แก้ไขได้
    } else {
      this.editTaskForm.disable(); // ปิดฟอร์มกลับไปเป็นดูอย่างเดียว
    }
  }

  onSubmit() {
    this.isLoading = true; // เปิด Loading Spinner ขณะรอส่งข้อมูล
     // ถ้าระบบตรวจแล้วฟอร์มไม่ถูกต้อง หรือไม่มีไอดีโปรเจกต์ ให้หยุดทำงาน
    if (this.editTaskForm.invalid || !this.projectId) {
      this.editTaskForm.markAllAsTouched();
      return;
    }

    const formValues = this.editTaskForm.value;

    // มัดรวมก้อน Payload ที่พร้อมส่งให้ NestJS
    const updatedTask = {
      title: formValues.title.trim(),
      description: formValues.description?.trim() || '',
      priority: formValues.priority,
      dueDate: formValues.dueDate ? new Date(formValues.dueDate).toISOString() : null,
      status: 'OPEN',
      assigneeId: formValues.assigneeId?.trim() || null
    };

    console.log('Sending Updated Task to NestJS Backend:', updatedTask);

    // ยิง API ยัดข้อมูลลง Endpoint หลังบ้าน (เช่น /projects/:id/tasks)
    this.apiService.put<any>(`/${this.projectId}/tasks/${this.taskId}`, updatedTask).subscribe({
      next: (res) => {
        console.log('Task updated successfully:', res);
        this.isEditMode = false; // ปิดโหมดแก้ไขกลับไปเป็นดูอย่างเดียว
        this.editTaskForm.disable(); // ปิดฟอร์มกลับไปเป็นดูอย่างเดียว
        this.isLoading = false; // ปิด Loading Spinner หลังจากอัปเดตเสร็จ
      },
      error: (err) => {
        this.isLoading = false; // ปิด Loading Spinner ถ้าเกิดข้อผิดพลาด
        console.error('Error updating task:', err);
        alert(err.error?.message || 'Failed to update task. Please try again.');
      }
    });
  }

  onDelete() {
    if (confirm(`Are you sure you want to delete this task?`)) {
      console.log('API Delete Call for Task ID:', this.taskId);
      this.apiService.delete<any>(`/${this.projectId}/tasks/${this.taskId}`).subscribe({
        next: (res) => {
          console.log('Task deleted successfully:', res);
          this.goBack();
        },
        error: (err) => {
          console.error('Error deleting task:', err);
          alert(err.error?.message || 'Failed to delete task. Please try again.');
        }
      });
    }
  }

  goBack() {
    window.history.back();
  }
}