import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';
import { UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {

  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService
  ) {}

  async findOne(userId: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      throw new InternalServerErrorException('Failed to find user');
    }
  }

  async update(userId: string, updateUserDto: UpdateUserDto, imagePath?: string) {
    // 1. ค้นหาผู้ใช้ปัจจุบัน
    const checkUser = await this.prisma.user.findFirst({
      where: { id: userId, status: 'ACTIVE' }
    });
    if (!checkUser) {
      if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath); // ลบรูปใหม่ที่เพิ่งอัปโหลดขึ้นมาทิ้งด้วยเพื่อไม่ให้ค้างคา
      throw new NotFoundException('User not found');
    }

    // 💡 ประกาศแบบ Union Type เพื่อให้ตัวแปรยอมรับค่าพ่นได้ทั้งข้อมูลจริง และ null
    let emailChanged = false;
    let newVerificationToken: string | null = null; // ยอมรับ string หรือ null
    let tokenExpiresAt: Date | null = null;         // ยอมรับ Date หรือ null

    if (updateUserDto.email && updateUserDto.email !== checkUser.email) {
      // เช็กว่าอีเมลใหม่ที่จะเปลี่ยน มีคนอื่นใช้ไปแล้วหรือยัง
      const emailExists = await this.prisma.user.findFirst({
        where: { email: updateUserDto.email, NOT: { id: userId } }
      });
      if (emailExists) {
        if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        throw new ConflictException('Email already in use by another account');
      }

      emailChanged = true;
      
      // เจนเนอเรต Token สำหรับยืนยันอีเมลใหม่ (อายุใช้งาน 1 ชั่วโมง)
      newVerificationToken = crypto.randomBytes(32).toString('hex');
      tokenExpiresAt = new Date();
      tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 1);
    }

    // 3. จัดการลบรูปโปรไฟล์เก่า (ใช้ process.cwd() ชี้พิกัดจาก Root โปรเจกต์)
    if (imagePath && checkUser.avatarUrl) {
      const oldFilePath = join(process.cwd(), checkUser.avatarUrl); 
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (err) {
          console.error('Failed to delete old avatar file:', err);
        }
      }
    }

    // 4. เตรียมข้อมูลที่จะบันทึก
    const updatedData = {
      ...updateUserDto,
      avatarUrl: imagePath ? imagePath : checkUser.avatarUrl,
      // 💡 ถ้ารีเซ็ตอีเมล ให้เปลี่ยนสถานะเป็น PENDING และฝังตัวยืนยันตัวตนลงไป
      ...(emailChanged && {
        status: 'PENDING',
        verificationToken: newVerificationToken,
        tokenExpiresAt: tokenExpiresAt,
        refreshToken: null // ล้าง Session เดิมทิ้งเพื่อบังคับออกจากระบบทุกอุปกรณ์
      })
    };

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: updateUserDto.name,
          email: updateUserDto.email,
          avatarUrl: imagePath ? imagePath : checkUser.avatarUrl,
          
          // 💡 ถ้ามีการเปลี่ยนอีเมล ให้ส่งค่า Enum และ Token ที่ถูกต้องของ Prisma เข้าไป
          ...(emailChanged ? {
            status: UserStatus.PENDING, // เปลี่ยนจาก string เปล่าๆ มาใช้ Enum ของ Prisma ตัวนี้แทน!
            verificationToken: newVerificationToken,
            tokenExpiresAt: tokenExpiresAt,
            refreshToken: null
          } : {})
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          status: true,
          updatedAt: true,
        }
      });

      // 5. ✉️ ส่งอีเมลยืนยันตัวตนชิ้นใหม่ หากมีการเปลี่ยนอีเมลจริง
      if (emailChanged) {
        const verificationUrl = `http://localhost:3000/auth/verify?token=${newVerificationToken}`;
        
        await this.mailerService.sendMail({
          to: updatedUser.email,
          subject: 'โปรดยืนยันอีเมลใหม่ของคุณสำหรับ TaskFlow',
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>คุณได้ทำการเปลี่ยนอีเมลใช้งาน!</h2>
              <p>กรุณากดลิงก์ด้านล่างเพื่อยืนยันและเปิดใช้งานอีเมลใหม่นี้ภายใน 1 ชั่วโมง:</p>
              <div style="margin: 20px 0;">
                <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  🔗 ยืนยันอีเมลใหม่ที่นี่
                </a>
              </div>
            </div>
          `,
        });
      }

      return updatedUser;

    } catch (error) {
      throw new InternalServerErrorException('Failed to update user profile');
    }
  }

  async delete(userId: string) {
    const checkUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
        status: 'ACTIVE'
      }
    });
    if(!checkUser) {
      throw new NotFoundException('User not found');
    }

    const deletedUser = await this.prisma.user.update({
      where: {
        id: userId,
        status: 'ACTIVE'
      },
      data: {
        status: 'INACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });
    return deletedUser;
  }

  async forgotPassword(email: string) {
    // ค้นหาผู้ใช้ (ต้องเป็นคนที่ ACTIVE แล้วเท่านั้น)
    const user = await this.prisma.user.findFirst({
      where: { email, status: 'ACTIVE' }
    });

    // Security Trick: หากไม่พบผู้ใช้ เพื่อความปลอดภัยไม่ควรบอกแฮกเกอร์ว่า "ไม่มีอีเมลนี้" 
    // ให้ส่งข้อความลวงกลับไปว่าสำเร็จเหมือนกัน แต่เบื้องหลังไม่มีการส่งอีเมลจริง
    if (!user) {
      return { message: 'Link for reset password has been sent.' };
    }

    try {
      // สร้าง Reset Token ความยาว 32 บิต
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // ⏰ ปลอดภัยสูง ให้เวลาแค่ 15 นาทีพอ

      // บันทึก Token ลงหลุมฐานข้อมูล
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: expiresAt
        }
      });

      // ส่งอีเมลหาผู้ใช้ (คราวนี้ลิงก์ต้องวิ่งไปหาหน้าบ้าน Angular พอร์ต 4200!)
      const resetUrl = `http://localhost:4200/reset-password?token=${resetToken}`;

      await this.mailerService.sendMail({
        to: user.email,
        subject: '💡 รีเซ็ตรหัสผ่านของคุณสำหรับ TaskFlow',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>คำขอกู้คืนรหัสผ่าน</h2>
            <p>คุณได้ทำการร้องขอบิตกู้รหัสผ่านใหม่ กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์นี้มีอายุ 15 นาที):</p>
            <div style="margin: 20px 0;">
              <a href="${resetUrl}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; rounded: 8px; font-weight: bold;">
                🔑 ตั้งรหัสผ่านใหม่ที่นี่
              </a>
            </div>
            <p style="font-size: 12px; color: #666;">หากคุณไม่ได้เป็นคนส่งคำขอนี้ สามารถปล่อยเบลออีเมลฉบับนี้ไปได้เลย รหัสผ่านเดิมของคุณยังคงปลอดภัย</p>
          </div>
        `
      });

      return { message: 'หากมีอีเมลนี้ในระบบ ลิงก์รีเซ็ตรหัสผ่านถูกส่งไปเรียบร้อยแล้ว' };

    } catch (error) {
      throw new InternalServerErrorException('Failed to process forgot password');
    }
  }

  // ตรวจตั๋วจากหน้าบ้าน -> บันทึกรหัสผ่านใหม่
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    // 1. ค้นหายูสเซอร์ที่รหัสตั๋วตรงกัน และตั๋วยังไม่หมดอายุ
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gte: new Date() } // ตั๋วต้องยังไม่หมดเวลา
      }
    });

    if (!user) {
      throw new BadRequestException('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หรือหมดอายุไปแล้ว');
    }

    // 2. แฮชรหัสผ่านใหม่เอี่ยมอ่อง
    const hashedPassword = await bcrypt.hash(confirmPassword, 10);

    // 3. บันทึกรหัสใหม่ลงฐานข้อมูล และทำการ "ทำลายตั๋ว" สิทธิ์นี้ทิ้งทันที (ป้องกันการเอาลิงก์มายิงซ้ำ)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,       // ล้างทิ้ง
        resetPasswordExpires: null,     // ล้างทิ้ง
        refreshToken: null              // ทริกเด็ด: ล้างรีเฟรชโทเค็นเก่าออกด้วย เพื่อเตะยูสเซอร์ออกจากระบบทุกอุปกรณ์ ให้ล็อกอินใหม่
      }
    });

    return { message: 'เปลี่ยนรหัสผ่านใหม่สำเร็จแล้ว เรียบร้อยครับ!' };
  }
}
