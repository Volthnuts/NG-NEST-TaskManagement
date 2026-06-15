import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RequestWithUser } from '../../interfaces/request-with-user/request-with-user.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {

  // รับ JwtService เข้ามาผ่าน Constructor เพื่อใช้งานภายในคลาส
  constructor(
    private jwtService: JwtService
  ) {}

  // ฟังก์ชันหลักที่ NestJS จะเรียกใช้เพื่อตัดสินว่า "ให้ผ่าน" (true) หรือ "ไม่ให้ผ่าน" (false)
  async canActivate(ctx: ExecutionContext): Promise<boolean> {

    // ดึง request จาก context http 
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const token = request.headers.authorization?.split(' ')[1]; // ดึง 'Bearer <token>'

    // ถ้าไม่มี token ใน header จะโยน UnauthorizedException ออกมา
    if (!token) throw new UnauthorizedException('Please login to access this resource');
    console.log('Token from header:', token);
    // พยายามตรวจสอบ token ด้วย jwtService.verifyAsync ซึ่งจะคืนค่า payload ถ้า token ถูกต้อง
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.AccessToken_SECRET,
      });
      console.log('Decoded JWT payload:', payload);
      // สร้าง ฟิลด์ user ใน request และเก็บข้อมูล payload ลงไป เพื่อให้ controller ต่างๆ 
      // สามารถเข้าถึงข้อมูลผู้ใช้ได้ผ่าน request.user
      // **ต้องผ่าน jwtAuthGuard ก่อน decorator GetUser จึงจะใช้งานได้**
      request.user = payload; 
      console.log('User attached to request:', request);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}