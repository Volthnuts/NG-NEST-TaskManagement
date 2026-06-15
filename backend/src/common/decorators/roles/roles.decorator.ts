import { SetMetadata } from '@nestjs/common';

// ใช้สำหรับระบุสิทธิ์บนหัว Controller เช่น @Roles('OWNER')
// ก็จะได้ metadata ที่ชื่อ 'roles' และมีค่าเป็น ['OWNER'] ไปเก็บไว้ใน metadata ของ controller นั้นๆ
// ใน roles.guard.ts เราจะดึง metadata 'roles' ออกมาเพื่อตรวจสอบว่า user ที่เข้ามามี role ตรงกับที่กำหนดไว้ใน controller หรือไม่
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);