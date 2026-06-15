import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// createParamDecorator ใช้สำหรับสร้าง custom decorator ที่สามารถดึงข้อมูลจาก request ได้
// executionContext ใช้สำหรับเข้าถึง context ของการทำงาน เช่น request, response, และอื่นๆ


// สร้าง custom decorator ชื่อ GetUser เพื่อดึงข้อมูลผู้ใช้จาก request
export const GetUser = createParamDecorator(

  // data คือข้อมูลที่ส่งเข้ามาใน decorator เช่น @GetUser('email') จะได้ 'email' เป็น data
  (data: string | undefined, ctx: ExecutionContext) => {
    // ดึง request จาก context http 
    const request = ctx.switchToHttp().getRequest();

    // ดึง user จาก request ซึ่งถูกเพิ่มเข้ามาโดย auth.guard.ts ที่ทำการตรวจสอบ JWT แล้ว
    const user = request.user;

    // ถ้าใส่ @GetUser('email') จะได้เฉพาะ email ถ้าไม่ใส่จะได้ user ทั้งก้อน
    // ถ้ามี data (เช่น 'id'): จะเช็คก่อนว่า user มีตัวตนไหม (user?) 
    // ถ้ามีก็จะดึงเฉพาะฟิลด์นั้นออกมา (user['id'])
    // ถ้าไม่มี data: จะส่ง user กลับไปทั้งก้อนเลย
    return data ? user?.[data] : user;
  },
);