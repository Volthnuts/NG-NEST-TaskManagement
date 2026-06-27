import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user) {
        return true; // ล็อกอินแล้ว ผ่านได้!
      } else {
        // ยังไม่ได้ล็อกอิน วาร์ปไปหน้า Login ทันที
        router.navigate(['/login']);
        return false;
      }
    })
  );
};