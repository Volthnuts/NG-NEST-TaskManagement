import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'src/common/interfaces/jwt-payload/jwt-payload.interface';

@Injectable()
export class AuthService {

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
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

    try {
      const hashedPassword = await bcrypt.hash(confirmPassword, 10);
      const newUser = await this.prisma.user.create({
        data: {
          email : email,
          password: hashedPassword
        }
      });
      const tokens = await this.tokenGenerate(newUser.id);
      await this.updateRefreshToken(newUser.id, tokens.refreshToken);
      return tokens;
    } catch (error) {
      throw new InternalServerErrorException('Failed to register user');
    }
   
  }

  async login(loginAuthDto: LoginAuthDto) {
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

    const tokens = await this.tokenGenerate(user.id);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
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
  async refreshTokens(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: process.env.RefreshToken_SECRET,
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

    const tokens = await this.tokenGenerate(user.id);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }
}
