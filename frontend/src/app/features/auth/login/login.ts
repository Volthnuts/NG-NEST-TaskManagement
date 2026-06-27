import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared-modules';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [
    SharedModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    const credentials = { email: this.email, password: this.password };
    
    this.authService.login(credentials).subscribe({
      next: (user) => {
        console.log('Login success, user data:', user);
        // วาร์ปเข้าหน้าเลือกโปรเจกต์ทันที (คุกกี้ AT/RT ถูกฝังลงเบราว์เซอร์เรียบร้อยแล้ว)
        this.router.navigate(['/select-project']);
      },
      error: (err) => {
        alert('Login failed: ' + err.error.message);
      }
    });
  }
}
