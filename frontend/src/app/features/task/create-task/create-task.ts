import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared-modules';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-create-task',
  imports: [
    SharedModule
  ],
  templateUrl: './create-task.html',
  styleUrl: './create-task.scss',
})
export class CreateTask implements OnInit {
  projectId: string | null = null;

  // ฟอร์มข้อมูล Task ใหม่
  title = '';
  description = '';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
  dueDate = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    // ดึง projectId จาก URL ของ Layout หลัก
    this.projectId = this.route.snapshot.parent?.paramMap.get('projectId') || null;
  }

  onSubmit() {
    if (!this.title.trim()) return;

    const newTask = {
      title: this.title,
      description: this.description,
      priority: this.priority,
      dueDate: this.dueDate,
      status: 'OPEN'
    };

    console.log('Sending New Task to NestJS Backend:', newTask);
    // TODO: ยิง API เซฟลงฐานข้อมูลผ่าน Service
    
    this.goBack();
  }

  goBack() {
    window.history.back();
  }
}