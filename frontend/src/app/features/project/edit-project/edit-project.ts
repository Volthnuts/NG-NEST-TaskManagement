import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared-modules';
import { Location } from '@angular/common';

@Component({
  selector: 'app-edit-project',
  imports: [
    SharedModule
  ],
  templateUrl: './edit-project.html',
  styleUrl: './edit-project.scss',
})
export class EditProject implements OnInit {
  projectId: string | null = null;
  
  // ข้อมูลเดิมที่โหลดมาจาก Backend (Dummy)
  projectName = 'Alpha Marketing Campaign';
  projectDescription = 'Workspace for coordinating Q3 marketing assets, social media, and client outreach.';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    // ดึง ID จาก URL เช่น /workspace/space-1/edit
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    console.log('Editing Project ID:', this.projectId);
    // TODO: เรียกใช้ Service เพื่อดึงข้อมูลโปรเจกต์ตาม ID นี้มาใส่ในฟิลด์
  }

  onSave() {
    if (!this.projectName.trim()) return;

    const updatedData = {
      name: this.projectName,
      description: this.projectDescription
    };

    console.log('Update API Call to NestJS:', updatedData);
    // TODO: เมื่อเซฟเสร็จ อาจจะย้อนกลับหน้าเดิม
    this.location.back();
  }

  onCancel() {
    this.location.back();
  }

  onDeleteProject() {
    if (confirm('Are you absolutely sure? This will delete the project and all its tasks.')) {
      console.log('Delete API Call to NestJS for ID:', this.projectId);
      // TODO: หลังลบเสร็จ ต้องพาผู้ใช้กลับไปหน้าเลือกโปรเจกต์หลัก
      this.router.navigate(['/select-project']);
    }
  }
}