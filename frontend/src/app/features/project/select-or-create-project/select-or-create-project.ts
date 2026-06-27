import { Component, OnInit } from '@angular/core';
import { CreateProject } from '../create-project/create-project';
import { SharedModule } from '../../../shared/shared-modules';

interface ProjectSpace {
  id: string;
  name: string;
  description: string;
  role: 'OWNER' | 'MEMBER' | 'ADMIN';
  memberCount: number;
  avatarUrl?: string;
}

@Component({
  selector: 'app-select-or-create-project',
  imports: [
    SharedModule,
    CreateProject
  ],
  templateUrl: './select-or-create-project.html',
  styleUrl: './select-or-create-project.scss',
})
export class SelectOrCreateProject {
  // สถานะปัจจุบัน: 'LIST' แสดงรายการ, 'CREATE' แสดงหน้าฟอร์มสร้าง
  currentView: 'LIST' | 'CREATE' = 'LIST';

  // จำลองข้อมูลสเปซที่มีอยู่ของผู้ใช้
  projectSpaces: ProjectSpace[] = [
    {
      id: 'space-1',
      name: 'Alpha Marketing Campaign',
      description: 'Workspace for coordinating Q3 marketing assets, social media, and client outreach.',
      role: 'OWNER',
      memberCount: 8
    },
    {
      id: 'space-2',
      name: 'Core Product Dev',
      description: 'Main repository space and sprint tracking for the software engineering team.',
      role: 'ADMIN',
      memberCount: 24
    },
    {
      id: 'space-3',
      name: 'Design System UX/UI',
      description: 'Shared Figma resources, design tokens, and frontend components overview.',
      role: 'MEMBER',
      memberCount: 5
    },
    {
      id: 'space-4',
      name: 'Beta Marketing Campaign',
      description: 'Workspace for coordinating Q3 marketing assets, social media, and client outreach.',
      role: 'OWNER',
      memberCount: 9
    },
    {
      id: 'space-5',
      name: 'Sub Product Dev',
      description: 'Main repository space and sprint tracking for the software engineering team.',
      role: 'ADMIN',
      memberCount: 36
    },
    {
      id: 'space-6',
      name: 'Expert System UX/UI',
      description: 'Shared Figma resources, design tokens, and frontend components overview.',
      role: 'MEMBER',
      memberCount: 10
    }
  ];

  constructor() { }

  selectSpace(spaceId: string) {
    console.log('Navigating to space:', spaceId);
  }

  // เปลี่ยนสถานะเพื่อเปิดหน้าสร้างโปรเจกต์
  openCreateForm() {
    this.currentView = 'CREATE';
  }

  // เปลี่ยนสถานะกลับมาหน้าเดิม
  backToList() {
    this.currentView = 'LIST';
  }

  // รับข้อมูลจากคอมโพเนนต์ลูกเพื่อบันทึก
  handleProjectCreation(newSpace: { name: string; description: string }) {
    console.log('Saving to NestJS:', newSpace);
    
    // Dummy: ยัดใส่ array หน้าบ้านไปก่อน
    this.projectSpaces.push({
      id: `space-${Date.now()}`,
      name: newSpace.name,
      description: newSpace.description,
      role: 'OWNER',
      memberCount: 1
    });

    // สร้างเสร็จแล้วย้อนกลับหน้าเดิม
    this.backToList();
  }
}