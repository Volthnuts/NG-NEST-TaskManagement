import { Component } from '@angular/core';
import { SharedModule } from '../../shared-modules';

interface Project {
  id: string;
  name: string;
}

@Component({
  selector: 'app-main-layout',
  imports: [
    SharedModule
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  // จำลองข้อมูลโปรเจกต์ที่ผู้ใช้เป็นสมาชิกอยู่
  projects: Project[] = [
    { id: 'space-1', name: 'Alpha Marketing Campaign' },
    { id: 'space-2', name: 'Core Product Dev' },
    { id: 'space-3', name: 'Design System UX/UI' }
  ];

  // จำลองโปรเจกต์ปัจจุบันที่ผู้ใช้กำลังเปิดทำงานอยู่
  currentProject: Project = this.projects[0];

  // ตัวแปรควบคุมการเปิด-ปิด Dropdown โปรเจกต์
  isProjectDropdownOpen = false;

  toggleProjectDropdown() {
    this.isProjectDropdownOpen = !this.isProjectDropdownOpen;
  }

  closeProjectDropdown() {
    this.isProjectDropdownOpen = false;
  }

  // 💡 ฟังก์ชันจัดการ Action ต่างๆ ของโปรเจกต์
  switchProject(project: Project) {
    this.currentProject = project;
    this.closeProjectDropdown();
    console.log('Switched to project:', project.name);
    // TODO: อาจจะสั่งเปลี่ยนหน้า หรือโหลดข้อมูลของโปรเจกต์นี้ใหม่
  }

  editProject(projectId: string, event: Event) {
    event.stopPropagation(); // กันไม่ให้ไปคลิกโดนตัวสลับโปรเจกต์
    this.closeProjectDropdown();
    console.log('Navigating to edit project ID:', projectId);
    // TODO: this.router.navigate(['/projects/edit', projectId]);
  }

  deleteProject(projectId: string, event: Event) {
    event.stopPropagation();
    this.closeProjectDropdown();
    console.log('Trigger delete dialog for project ID:', projectId);
    // TODO: เปิด Modal ยืนยันการลบ
  }

  viewMembers(projectId: string, event: Event) {
    event.stopPropagation();
    this.closeProjectDropdown();
    console.log('Navigating to members list for project ID:', projectId);
    // TODO: this.router.navigate(['/projects', projectId, 'members']);
  }
}
