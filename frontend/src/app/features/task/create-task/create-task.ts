import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared-modules';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // อิมพอร์ตเครื่องมือจัดฟอร์ม
import { ApiService } from '../../../core/services/api.service'; // อิมพอร์ต ApiService

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [
    SharedModule
  ],
  templateUrl: './create-task.html',
  styleUrl: './create-task.scss',
})
export class CreateTask implements OnInit {
  taskForm!: FormGroup; // ตัวแปรควบคุมฟอร์ม
  projectId: string | null = null;
  isLoading = false;
  assignee: any[] = [];

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private cdr: ChangeDetectorRef, // ฉีด ChangeDetectorRef
    private fb: FormBuilder, // ฉีด FormBuilder
    private apiService: ApiService // ฉีด ApiService
  ) {}

  ngOnInit(): void {
    // ดึง projectId จาก URL ของ Parent Route
    this.projectId = this.route.snapshot.parent?.paramMap.get('projectId') || null;
    console.log('Create Task: Target Project ID:', this.projectId);

    // ตั้งค่าโครงสร้างฟอร์มแบบ Reactive
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.pattern(/.*\S.*/)]], // ห้ามเว้นว่าง/เคาะ Spacebar รัวๆ
      description: [''],
      priority: ['MEDIUM', Validators.required],
      dueDate: [''],
      assigneeId: ['']
    });

    // assignee array ดึงค่าจาก api
    this.apiService.get<string[]>(`/projects/${this.projectId}/users`).subscribe({
      next: (res) => {
        this.assignee = res;
        console.log('Fetched assignees:', this.assignee);
        this.cdr.detectChanges(); // แจ้ง Angular ให้ตรวจสอบการเปลี่ยนแปลง
      },
      error: (err) => {
        console.error('Error fetching assignees:', err);
      }
    });
  }

  onSubmit() {
    // ถ้าระบบตรวจแล้วฟอร์มไม่ถูกต้อง หรือไม่มีไอดีโปรเจกต์ ให้หยุดทำงาน
    if (this.taskForm.invalid || !this.projectId) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValues = this.taskForm.value;

    // มัดรวมก้อน Payload ที่พร้อมส่งให้ NestJS
    const newTask = {
      title: formValues.title.trim(),
      description: formValues.description?.trim() || '',
      priority: formValues.priority,
      dueDate: formValues.dueDate || null,
      status: 'OPEN',
      assigneeId: formValues.assigneeId?.trim() || null
    };

    console.log('Sending New Task to NestJS Backend:', newTask);

    // ยิง API ยัดข้อมูลลง Endpoint หลังบ้าน (เช่น /projects/:id/tasks)
    this.apiService.post<any>(`/${this.projectId}/tasks`, newTask).subscribe({
      next: (res) => {
        console.log('Task created successfully:', res);
        this.isLoading = false;
        this.goBack(); // เซฟเสร็จดีดผู้ใช้กลับหน้ากระดานรวมงาน
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error creating task:', err);
        alert(err.error?.message || 'Failed to create task. Please try again.');
      }
    });
  }

  goBack() {
    window.history.back();
  }
}