import { Request } from 'express';
import { JwtPayload } from '../jwt-payload/jwt-payload.interface';

// ขยายความสามารถของ Request ปกติให้มีฟิลด์ user แปะไปด้วย
// ใน request จะไม่มีข้อมุล user อยู่แล้ว แต่เราจะเพิ่มมันเข้าไปเพื่อให้สะดวกในการใช้งานใน controller ต่างๆ ที่ต้องการข้อมูลผู้ใช้
// โดยสามารถเรียกใช้แบบ request.user.userId, request.user.email, request.user.role ได้เลย
// เอาไปใช้ใน auth.guard.ts เพื่อเก็บข้อมูลผู้ใช้ที่ถูกตรวจสอบแล้วลงใน request.user
export interface RequestWithUser extends Request {
  user: JwtPayload;
}