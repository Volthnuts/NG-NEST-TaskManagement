import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core'; // ตัวช่วยสำหรับดึงค่า Metadata (สติกเกอร์ที่แปะไว้ตาม Method ต่างๆ)
import { RequestWithUser } from 'src/common/interfaces/request-with-user/request-with-user.interface';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  // รับ Reflector เข้ามาเพื่อใช้ "ส่อง" ดูว่าแต่ละ Route มีการแปะ @Roles ไว้หรือไม่
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // ดึงข้อมูล Roles ที่ต้องการจาก Metadata โดยใช้ Key ชื่อ 'roles' (ที่ตั้งไว้ใน Decorator)
    // ctx.getHandler() คือการบอกให้ Reflector ไปดูที่ "ฟังก์ชัน" ของ Controller ที่กำลังถูกเรียก
    const requiredRoles = this.reflector.get<string[]>('roles', ctx.getHandler());

    // ถ้า Route นี้ไม่ได้แปะ @Roles(...) ไว้ (คือไม่มีการจำกัดสิทธิ์)
    // ให้คืนค่า true เพื่ออนุญาตให้ทุกคนผ่านเข้าไปได้เลย
    if (!requiredRoles) return true;

    // ดึง Request Object ออกมา และใช้ Interface 'RequestWithUser' เพื่อให้ได้ Type ของ user
    // *สำคัญ: ต้องใช้ JwtAuthGuard มาก่อนหน้า เพื่อให้มีข้อมูล user ใน request*
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const userId = String(request.user.userId); // ได้มาจาก JWT Token
    const projectId = String(request.params.projectId); // ดึง ID โปรเจกต์จาก URL มาเช็ก

    // ไปถาม Prisma ว่า "User คนนี้ ในโปรเจกต์นี้ มี Role อะไร?"
    // ใน schema.prisma เราได้ตั้งค่า **@@unique([projectId, userId])** ไว้แล้ว 
    // ซึ่ง Prisma จะสร้างชื่อเรียกความสัมพันธ์นี้เป็น **projectId_userId**
    // และโมเดล **ProjectMember จะใช้ projectMember** ในการเชื่อม database
    const hasRole = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    });

    // ถ้าเช็คแล้ว "ไม่มีสิทธิ์" ให้โยน Error 403 (Forbidden) กลับไปหา Client ทันที
    if (!hasRole) throw new ForbiddenException('You do not have permission to access this resource');
    
    // ถ้ามีสิทธิ์ถูกต้อง คืนค่า true เพื่ออนุญาตให้เข้าถึง Controller Method ได้
    return true;
  }
}