import { Component, EventEmitter, Output } from '@angular/core';
import { SharedModule } from '../../../shared/shared-modules';

@Component({
  selector: 'app-create-project',
  imports: [
    SharedModule
  ],
  templateUrl: './create-project.html',
  styleUrl: './create-project.scss',
})
export class CreateProject {
  projectName = '';
  projectDescription = '';

  // ส่ง Event กลับไปบอกคอมโพเนนต์หลักเมื่อทำงานเสร็จ
  @Output() cancel = new EventEmitter<void>();
  @Output() projectCreated = new EventEmitter<{ name: string; description: string }>();

  onCancel() {
    this.cancel.emit();
  }

  onSubmit() {
    if (!this.projectName.trim()) return;

    // ส่งข้อมูลโปรเจกต์ใหม่กลับไปให้คอมโพเนนต์หลักจัดการยิง API
    this.projectCreated.emit({
      name: this.projectName,
      description: this.projectDescription
    });

    // รีเซ็ตฟอร์ม
    this.projectName = '';
    this.projectDescription = '';
  }
}
