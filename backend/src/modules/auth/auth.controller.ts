import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res, UnauthorizedException, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import type { RequestWithUser } from 'src/common/interfaces/request-with-user/request-with-user.interface';
import express from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerAuthDto: RegisterAuthDto
  ) {
    return this.authService.register(registerAuthDto);
  }

  @Get('verify')
  async verifyEmail(
    @Query('token') token: string
  ) {
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }
    return this.authService.verifyEmail(token);
  }
  
  @Post('login')
  async login(
    @Body() loginAuthDto: LoginAuthDto,
    @Res({ passthrough: true }) response: express.Response
  ) {
    return this.authService.login(loginAuthDto,response);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() request: RequestWithUser) {
    // ดึง userId จาก JWT ที่ถูกตรวจสอบแล้วใน JwtAuthGuard
    // JwtAuthGuard ได้เพิ่มข้อมูล user ลงใน req.user
    const userId = request.user.userId;
    return this.authService.logout(userId);
  }

  @Post('refreshToken')
  async refresh(
    @Req() request: express.Request, // อ่านข้อมูลคุกกี้ผ่าน Request
    @Res({ passthrough: true }) response: express.Response
  ) {
    // แกะ Refresh Token ออกจากคุกกี้เงียบๆ ไม่ต้องผ่าน Body
    const refreshToken = request.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    return this.authService.refreshTokens(refreshToken, response);
  }
}
