import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'src/common/interfaces/jwt-payload/jwt-payload.interface';
import express from 'express';
import { MailerService } from '@nestjs-modules/mailer';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailerService: MailerService
  ) {}

  async register(registerAuthDto: RegisterAuthDto) {
    const { email, confirmPassword, password } = registerAuthDto;
    const existingUser = await this.prisma.user.findFirst({ 
      where: { email, status: 'ACTIVE' }
    });

    if (password !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }  

    // เจนเนอเรต Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 1); // ⏰ มีอายุใช้งาน 1 ชั่วโมง

    try {
      const hashedPassword = await bcrypt.hash(confirmPassword, 10);

      // บันทึกข้อมูลผู้ใช้ลงฐานข้อมูล (สถานะจะเป็น PENDING โดยอัตโนมัติตาม schema)
      const newUser = await this.prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          verificationToken: verificationToken,
          tokenExpiresAt: tokenExpiresAt
        }
      });

      // const tokens = await this.tokenGenerate(newUser.id);
      // await this.updateRefreshToken(newUser.id, tokens.refreshToken);
      // return tokens;

      // ส่งอีเมลลิงก์ยืนยันตัวตนออกไปหาผู้ใช้
      const verificationUrl = `http://localhost:3000/auth/verify?token=${verificationToken}`;
      
      await this.mailerService.sendMail({
        to: newUser.email,
        subject: 'ยืนยันอีเมลของคุณสำหรับใช้งาน TaskFlow',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>ยินดีต้อนรับสู่ TaskFlow!</h2>
            <p>กรุณากดปุ่มด้านล่างนี้เพื่อทำการยืนยันอีเมลและเปิดใช้งานบัญชีของคุณ (ลิงก์นี้มีอายุ 1 ชั่วโมง):</p>
            <div style="margin: 20px 0;">
              <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; rounded: 8px; font-weight: bold;">
                🔗 คลิกที่นี่เพื่อยืนยันอีเมล
              </a>
            </div>
            <p style="font-size: 12px; color: #666;">หากปุ่มกดไม่ได้ สามารถก๊อปปี้ลิงก์นี้ไปวางที่บราวเซอร์ได้โดยตรง: ${verificationUrl}</p>
          </div>
        `,
      });

      // คืนค่าบอกหน้าบ้านว่าสมัครสำเร็จแล้ว ให้ไปเช็กเมล (ไม่ต้องส่ง Token ล็อกอินกลับไป)
      return { 
        message: 'Registration successful. Please check your email to verify your account.' 
      };

    } catch (error) {
      throw new InternalServerErrorException('Failed to register user');
    }
   
  }

  // ลอจิกตรวจสอบตั๋วหลังจากผู้ใช้กดลิงก์จากอีเมลกลับมา
  async verifyEmail(token: string) {
    // ค้นหาผู้ใช้ที่มี Token ตรงกัน และเวลา Token ยังไม่หมดอายุ
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        tokenExpiresAt: { gte: new Date() } // เช็กว่าเวลาหมดอายุต้องมากกว่าหรือเท่ากับเวลาปัจจุบัน
      }
    });

    if (!user) {
      throw new BadRequestException('ลิงก์ยืนยันตัวตนไม่ถูกต้อง หรือหมดอายุไปแล้ว');
    }

    // ทำการเปลี่ยนสถานะผู้ใช้เป็น ACTIVE และล้างข้อมูลตั๋วทิ้ง
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
        verificationToken: null,
        tokenExpiresAt: null
      }
    });

    return { message: 'Email verified successfully! You can now login.' };
  }

  async login(
    loginAuthDto: LoginAuthDto,
    response: express.Response
  ) {
    const { email, password } = loginAuthDto;
    const user = await this.prisma.user.findFirst({ 
      where: { 
        email: email,
        status: 'ACTIVE' 
      }
    });
    const passwordMatch = await bcrypt.compare(password, user!.password);

    if (!user || !passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // เจนคู่หู Tokens ตัวใหม่ขึ้นมา 
    const tokens = await this.tokenGenerate(user.id);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // ฝัง Access Token ลงคุกกี้ (อายุสั้น ปลอดภัยสูง)
    response.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: false, // ปรับเป็น true เมื่อขึ้นระบบจริงที่เป็น HTTPS
      sameSite: 'lax',
      maxAge: 1000 * 60 * 15 // อยู่ได้ 15 นาที
    });

    // ฝัง Refresh Token ลงคุกกี้ (อายุนาน คอยชุบชีวิต Access Token)
    response.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: false, // ปรับเป็น true เมื่อขึ้นระบบจริงที่เป็น HTTPS
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7 // อยู่ได้ 7 วัน
    });

    // ส่งก้อนข้อมูลผู้ใช้เปล่าๆ กลับไปให้ Angular โดยไม่ต้องแนบ Token โต้งๆ อีกต่อไป
    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  // ----- Extra Methods ----- //
  // สร้างฟังก์ชันสำหรับสร้าง Access Token และ Refresh Token
  async tokenGenerate(userId: string) {
    const payload: JwtPayload = { userId: userId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('AccessToken_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('RefreshToken_SECRET'),
        expiresIn: '7d',
      }),
    ]);
    return { 
      accessToken, refreshToken 
    };
  }

  // สร้างฟังก์ชันสำหรับเก็บ Refresh Token ในฐานข้อมูล
  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        refreshToken: hashedRefreshToken 
      },
    });
  }

  // สร้างฟังก์ชันสำหรับรีเฟรช Token 
  async refreshTokens(refreshToken: string, response: express.Response) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get<string>('RefreshToken_SECRET'), // ใช้ผ่าน config service
      });
        
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Access Denied');
      }

      const refreshTokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!refreshTokenMatch) {
        throw new UnauthorizedException('Access Denied');
      }

      // เจนเนอเรตคู่หู Tokens ชุดใหม่ขึ้นมา
      const tokens = await this.tokenGenerate(user.id);
      
      // อัปเดต Hashed RT ลงใน Database แทนของเดิม
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      // สั่งเขียนทับคุกกี้ใบเก่าบนเบราว์เซอร์ของหน้าบ้าน
      response.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: false, // ปรับเป็น true บน Production (HTTPS)
        sameSite: 'lax',
        maxAge: 1000 * 60 * 15 // 15 นาที
      });

      response.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 วัน
      });

      // ส่งสถานะตอบกลับหน้าบ้านไปว่าเสร็จสิ้น (ไม่ต้องคืนก้อน Token ออกไป)
      return { success: true };

    } catch (error) {
      // ถ้าเกิดกรณี Refresh Token หมดอายุ หรือถอดรหัสไม่ได้ (โดนแก้แอบแฝง) ดักจับแล้วเตะออกทันที
      throw new UnauthorizedException('Session expired, please login again');
    }
  }
}
