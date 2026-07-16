import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // เพิ่ม ReactiveFormsModule
import { SharedModule } from '../../../shared/shared-modules';
import { Location, CommonModule } from '@angular/common';
import { LoadingPage } from '../../../shared/loading-page/loading-page';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-edit-project',
  standalone: true,
  imports: [
    SharedModule,
    LoadingPage
  ],
  templateUrl: './edit-project.html',
  styleUrl: './edit-project.scss',
})
export class EditProject implements OnInit {
  projectId: string | null = null;
  editProjectForm!: FormGroup; // ประกาศตัวแปรกลุ่มฟอร์ม
  currentUser: any;

  isOwner = false; // ตัวแปรควบคุมสิทธิ์
  isLoading = false; // สแตนด์บายเปิด/ปิดสถานะโหลดข้อมูล

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService, // สมมติว่ามี ApiService สำหรับเรียก API
    private location: Location,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder // Inject FormBuilder เข้ามาใช้งาน
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.parent?.paramMap.get('projectId') || '';
    this.currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');

    // 1. เริ่มต้นสร้างโครงสร้างฟอร์มพร้อมตัวดักจับข้อความว่าง (Spacebar รัวๆ)
    this.editProjectForm = this.fb.group({
      projectName: ['', [Validators.required, Validators.pattern(/.*\S.*/)]],
      projectDescription: ['']
    });
    this.editProjectForm.disable();

    console.log('Editing Project ID:', this.projectId);
    
    // 2. จำลองสถานะดึงข้อมูลจาก API (โหลดเสร็จแล้วยัดค่าเข้าฟอร์ม)
    this.loadProjectDetails();
  }

  loadProjectDetails(): void {
    this.isLoading = true;
    this.apiService.get<any>(`/projects/${this.projectId}`).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isOwner = this.currentUser && (this.currentUser.id === res.members[0].userId);
        console.log('this.isOwner ', this.isOwner)

        if(this.isOwner){
          this.editProjectForm.enable();
        }

        console.log('Project details loaded:', res);
        // 3. นำข้อมูลยัดเข้าสู่ระบบฟอร์มของ Angular
        this.editProjectForm.patchValue({
          projectName: res.name,
          projectDescription: res.description
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Layout: Error loading workspaces', err);
      }
    });
  }

  onSubmit() {
    this.isLoading = true; // เปิด Loading Spinner ขณะรอส่งข้อมูล
     // ถ้าระบบตรวจแล้วฟอร์มไม่ถูกต้อง หรือไม่มีไอดีโปรเจกต์ ให้หยุดทำงาน
    if (this.editProjectForm.invalid || !this.projectId) {
      this.editProjectForm.markAllAsTouched();
      return;
    }

    const formValue = this.editProjectForm.value;

    const updatedData = {
      name: formValue.projectName.trim(),
      description: formValue.projectDescription
    };

    console.log('Update API Call to NestJS:', updatedData);
    // ยิง API ยัดข้อมูลลง Endpoint หลังบ้าน (เช่น /projects/:id/tasks)
    this.apiService.put<any>(`/projects/${this.projectId}`, updatedData).subscribe({
      next: (res) => {
        console.log('Project updated successfully:', res);
        this.isLoading = false; // ปิดโหมดแก้ไขกลับไปเป็นดูอย่างเดียว
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false; // ปิด Loading Spinner ถ้าเกิดข้อผิดพลาด
        console.error('Error updating project:', err);
        alert(err.error?.message || 'Failed to update project. Please try again.');
      }
    });
  }

  onCancel() {
    this.location.back();
  }

  onDeleteProject() {
    if (confirm('Are you absolutely sure? This will delete the project and all its tasks.')) {
      console.log('Delete API Call to NestJS for ID:', this.projectId);
      this.apiService.delete<any>(`/projects/${this.projectId}`).subscribe({
        next: (res) => {
          console.log('Task deleted successfully:', res);
          this.router.navigate(['/projetSelect']);
        },
        error: (err) => {
          console.error('Error deleting task:', err);
          alert(err.error?.message || 'Failed to delete task. Please try again.');
        }
      });
    }
  }
}