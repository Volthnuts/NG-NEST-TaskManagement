import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared-modules';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assignee?: {
    name: string;
    avatarUrl?: string;
  };
}

@Component({
  selector: 'app-project-task-list',
  imports: [
    SharedModule
  ],
  templateUrl: './project-task-list.html',
  styleUrl: './project-task-list.scss',
})
export class ProjectTaskList implements OnInit {
  
  // จำลองข้อมูลรายการงานในโปรเจกต์นี้
  tasks: TaskItem[] = [
    {
      id: 'task-1',
      title: 'Design Authentication Flow UI/UX',
      description: 'Create Figma wireframes for login, register, and forgot password pages.',
      status: 'DONE',
      priority: 'HIGH',
      dueDate: '2026-06-25',
      assignee: { name: 'Alex Rivers' }
    },
    {
      id: 'task-2',
      title: 'Setup NestJS Backend Framework & Prisma DB',
      description: 'Configure PostgreSQL datasource, generate client, and map initial models.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      dueDate: '2026-06-28',
      assignee: { name: 'You' }
    },
    {
      id: 'task-3',
      title: 'Implement Angular Project Space Selector',
      description: 'Develop UI for selecting existing workspace and connecting with layout components.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: '2026-07-02',
      assignee: { name: 'You' }
    },
    {
      id: 'task-4',
      title: 'Write API Documentation via Swagger',
      description: 'Document all auth and project-related endpoints for frontend integration.',
      status: 'OPEN',
      priority: 'LOW',
      dueDate: '2026-07-10'
    }
  ];

  // ตัวแปรสำหรับฟิลเตอร์และค้นหา
  searchQuery = '';
  statusFilter = 'ALL';

  constructor() {}

  ngOnInit(): void {}

  // ฟังก์ชันคำนวณและกรองข้อมูลงานที่จะนำไปแสดงผลบนหน้าเว็บ
  get filteredTasks(): TaskItem[] {
    return this.tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            (task.description && task.description.toLowerCase().includes(this.searchQuery.toLowerCase()));
      
      const matchesStatus = this.statusFilter === 'ALL' || task.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }

  // Action Buttons ต่างๆ
  openCreateTaskModal() {
    console.log('Open modal to create a new task...');
  }

  editTask(taskId: string) {
    console.log('Edit task ID:', taskId);
  }

  deleteTask(taskId: string) {
    console.log('Delete task ID:', taskId);
  }
}