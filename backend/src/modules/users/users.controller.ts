import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import type { RequestWithUser } from 'src/common/interfaces/request-with-user/request-with-user.interface';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LocalFilesInterceptor } from 'src/common/interceptors/local-file-images/local-file-images.interceptor';
import { Multer } from 'multer';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ต้องเอา static route ขึ้นก่อนเสมอ เดี๋ยวจะ catch
  @UseGuards(JwtAuthGuard)
  @Get('my-profile')
  getProfile(
    @Req() request: RequestWithUser) 
  {
    return this.usersService.findOne(request.user.userId);
  }

  // เอา Dynamic Parameter route ไว้ทีหลัง
  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  findOne(@Param('userId') userId: string) {
    return this.usersService.findOne(userId);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    LocalFilesInterceptor({
      fieldName: 'image', 
      destination: './uploads/profile-images', 
    }),
  )
  @Put('my-profile')
  update(
    @Req() request: RequestWithUser, 
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() avatarImg?: Multer.File
  ) {
    let imagePath: string | undefined = undefined;

  // เช็กว่ามีการอัปโหลดรูปมาจริงไหม
  if (avatarImg) {
    imagePath = `/uploads/profile-images/${avatarImg.filename}`;
  }

  // ส่งทั้งข้อมูลทั่วไป (Dto) และ Path รูปภาพ (ถ้ามี) ไปให้ Service จัดการต่อ
  return this.usersService.update(request.user.userId, updateUserDto, imagePath);
  }

  // ช่องทางรับอีเมลเพื่อยิงลิงก์กู้ภัย
  @Post('forgot-password')
  async forgotPassword(
    @Body() body: { 
      email: string
      resetUrl: string 
    }
  ) {
    const { email, resetUrl } = body;
    return this.usersService.forgotPassword(email,resetUrl);
  }

  // ช่องทางรับรหัสผ่านใหม่พ่วง Token จากหน้าบ้านมาบันทึก
  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto
  ) {
    return this.usersService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  async changePassword(
    @Body() body: { 
      email: string
      resetUrl: string 
    }
  ) {
    const { email, resetUrl } = body;
    return this.usersService.changePassword(email, resetUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('my-account')
  remove(@Req() request: RequestWithUser) {
    return this.usersService.delete(request.user.userId);
  }
}
