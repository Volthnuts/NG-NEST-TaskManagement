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

  async forgotPassword(email: string, resetUrl: string) {
  // ค้นหาผู้ใช้
  const user = await this.prisma.user.findFirst({
    where: { email, status: 'ACTIVE' }
  });

  // ถ้าไม่เจอยูสเซอร์ ให้ดีดตอบกลับหน้าบ้านทันทีแบบไม่ค้าง!
  if (!user) {
    return { 
      message: 'If this email exists in our system, a password reset link has been sent successfully.' 
    };
  }

  // ถ้าเจอยูสเซอร์ ค่อยขยับมาทำลอจิกส่งเมลในบล็อก try-catch
  try {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiresAt
      }
    });

    const resetUrlWithToken = `${resetUrl}?token=${resetToken}`;

    // บรรทัดนี้ตัวดี! ลองใส่ console.log ดักไว้ดูว่ามันติดหล่มที่นี่ไหม
    console.log('--- กำลังจะเริ่มส่งอีเมล ---');

      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Reset Your Password for TaskFlow',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Please click the button below to set up a new password (this link will expire in 15 minutes):</p>
            
            <div style="margin: 25px 0;">
              <a href="${resetUrlWithToken}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reset Password Here
              </a>
            </div>
            
            <p style="font-size: 12px; color: #666; margin-top: 20px;">If you did not request this password reset, you can safely ignore this email. Your current password remains secure.</p>
          </div>
        `
      });

      console.log('--- ส่งอีเมลสำเร็จแล้ว ---');

      return { 
        message: 'If this email exists in our system, a password reset link has been sent successfully.' 
      };

    } catch (error) {
      // พิมพ์ดูตรงนี้เลยครับว่าระบบเมลพังเพราะอะไร (เช่น ต่อ SMTP ไม่ติด)
      console.error('Mailer error detail:', error); 
      throw new InternalServerErrorException('Failed to process forgot password');
    }
  }

  async changePassword(email: string, resetUrl: string) {
    // ค้นหาผู้ใช้
    const user = await this.prisma.user.findFirst({
      where: { email, status: 'ACTIVE' }
    });

    // ถ้าไม่เจอยูสเซอร์ ให้ดีดตอบกลับหน้าบ้านทันทีแบบไม่ค้าง!
    if (!user) {
      return { 
        message: 'If this email exists in our system, a password change link has been sent successfully.' 
      };
    }

    // ถ้าเจอยูสเซอร์ ค่อยขยับมาทำลอจิกส่งเมลในบล็อก try-catch
    try {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: expiresAt
        }
      });

      const resetUrlWithToken = `${resetUrl}?token=${resetToken}`;

      console.log('--- กำลังจะเริ่มส่งอีเมล ---');

      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Change Your Password for TaskFlow', 
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
            <h2>Password Change Request</h2> 
            <p>We received a request to change your password. Please click the button below to set up your new password (this link will expire in 15 minutes):</p>
            
            <div style="margin: 25px 0;">
              <a href="${resetUrlWithToken}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Change Password Here
              </a>
            </div>
            
            <p style="font-size: 12px; color: #666; margin-top: 20px;">If you did not request this change, please secure your account or contact support immediately. Your current password remains secure until updated.</p>
          </div>
        `
      });

      console.log('--- ส่งอีเมลสำเร็จแล้ว ---');

      // เปลี่ยนข้อความตอบกลับหน้าบ้าน
      return { 
        message: 'If this email exists in our system, a password change link has been sent successfully.' 
      };

    } catch (error) {
      console.error('Mailer error detail:', error); 
      throw new InternalServerErrorException('Failed to process change password');
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
      throw new BadRequestException('Reset link is invalid or expired');
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
