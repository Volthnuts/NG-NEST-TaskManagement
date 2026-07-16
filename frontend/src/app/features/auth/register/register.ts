import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared-modules';
import { ApiService } from '../../../core/services/api.service';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms'; // 💡 เพิ่มอิมพอร์ต AbstractControl, ValidationErrors
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [SharedModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  isRegisteredSuccess = false;
  registerForm!: FormGroup;
  isLoading = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]]
    }, {
      // 🎯 แก้ไขจุดที่ 1: ผูก .bind(this) เข้าไป เพื่อไม่ให้ context ของ class หลุดหายเวลา Validator ทำงาน
      validators: this.passwordMatchValidator.bind(this) 
    });
  }

  // 🎯 แก้ไขจุดที่ 2: เปลี่ยนสไตล์ Type ให้เป็นสากลตามสเปกของ Angular (AbstractControl)
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const form = control as FormGroup;
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    // เคลียร์ error เก่าออกก่อน ถ้าหากรอบนี้พิมพ์ตรงกันแล้ว
    const confirmPasswordControl = form.get('confirmPassword');
    if (confirmPasswordControl?.errors?.['passwordMismatch']) {
      confirmPasswordControl.setErrors(null);
    }

    if (password !== confirmPassword) {
      confirmPasswordControl?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    
    const { name, email, password, confirmPassword } = this.registerForm.value;
    const registerData = { name, email, password, confirmPassword };
    
    console.log('data : ', registerData);

    this.apiService.post<any>('/auth/register', registerData).subscribe({
      next: (res) => {
        // รอบนี้ทำงานได้อย่างปลอดภัย ไม่ค้างแล้วครับ 🎉
        this.isLoading = false;        
        this.isRegisteredSuccess = true; 
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges(); // ใส่เพิ่มตรงนี้ด้วย เผื่อกรณี Error แล้ว UI ไม่ยอมหยุดหมุน
        alert(err.error?.message || 'Register failed');
      }
    });
  }
}