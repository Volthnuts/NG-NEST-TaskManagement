import { Component, EventEmitter, OnInit, Output } from '@angular/core'; // เพิ่ม OnInit
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // อิมพอร์ตเครื่องมือจัดการฟอร์ม
import { SharedModule } from '../../../../shared/shared-modules';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [
    SharedModule // มั่นใจว่าใน SharedModule มีการอิมพอร์ต ReactiveFormsModule ไว้แล้ว
  ],
  templateUrl: './create-project.html',
  styleUrl: './create-project.scss',
})
export class CreateProject implements OnInit {
  projectForm!: FormGroup; // สร้างตัวแปรควบคุมฟอร์ม

  // ส่ง Event กลับไปบอกคอมโพเนนต์หลักเมื่อทำงานเสร็จ
  @Output() cancel = new EventEmitter<void>();
  @Output() projectCreated = new EventEmitter<{ name: string; description: string }>();

  constructor(private fb: FormBuilder) {} // ฉีด FormBuilder เข้ามาใช้งาน

  ngOnInit(): void {
    // ตั้งค่าโครงสร้างฟอร์มพร้อมตัวตรวจสอบ (Validators)
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/.*\S.*/)]], // ห้ามเว้นว่างและห้ามกด spacebar รัวๆ
      description: ['']
    });
  }

  onCancel() {
    this.cancel.emit();
  }

  onSubmit() {
    // ถ้าระบบตรวจแล้วฟอร์มไม่ถูกต้อง (ไม่ได้กรอกชื่อโปรเจกต์) ให้หยุดทำงาน
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    // ดึงค่าจาก ฟอร์ม ออกมาใช้งานพร้อมตัดช่องว่างหน้า-หลัง (Trim)
    const formValues = this.projectForm.value;
    
    // emit ค่าส่งไปยังคอมโพเนนต์หลักพร้อมข้อมูลโปรเจกต์ใหม่ใน select-or-create-project
    this.projectCreated.emit({
      name: formValues.name.trim(),
      description: formValues.description?.trim() || ''
    });

    // รีเซ็ตฟอร์มกลับเป็นค่าว่าง
    this.projectForm.reset();
  }
}