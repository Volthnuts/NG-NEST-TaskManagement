import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // 💡 ลงทะเบียนเพื่อให้ทุกการยิง HTTP ผ่าน Interceptor ตัวนี้เพื่อตรวจจับคุกกี้และ Error 401
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    )
  ]
};
