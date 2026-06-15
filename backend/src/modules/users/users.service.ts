import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class UsersService {

  constructor(
    private prisma: PrismaService,
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
    const checkUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
        status: 'ACTIVE'
      }
    });
    if(!checkUser) {
      throw new NotFoundException('User not found');
    }

    if(imagePath) {
      if (checkUser.avatarUrl) {
        // ต่อเบาะแสไปหาไฟล์จริงในเครื่อง เช่น ./uploads/profile-images/abc.png
        const oldFilePath = join(__dirname, '..', '..', checkUser.avatarUrl); 
        
        // เช็กว่าไฟล์มีอยู่จริงบน disk ไหม แล้วสั่งลบ
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }
    
    // เพิ่มฟิลด์ avatarUrl แทนที่จะเพิ่มตรงๆใน dto เพราะเราไม่อยากให้ client ต้องส่ง path ของรูปมาเอง
    // ถ้ามีการอัปโหลดรูปใหม่ เราจะใช้ path ใหม่ ถ้าไม่มี เราจะเก็บ path เดิมไว้ 
    const updatedData = {
      ...updateUserDto,
      avatarUrl: imagePath ? imagePath : checkUser.avatarUrl, // ถ้ามีรูปใหม่ก็อัปเดต ถ้าไม่มีก็เก็บของเดิม
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
        status: 'ACTIVE'
      },
      data: {
        ...updatedData,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        updatedAt: true,
      }
    });
    return updatedUser;
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

  async changePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    const checkUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
        status: 'ACTIVE'
      }
    });
    if(!checkUser) {
      throw new NotFoundException('User not found');
    }

    const { newPassword, confirmPassword, oldPassword } = updatePasswordDto;
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    const checkOldPassword = await bcrypt.compare(oldPassword, checkUser.password);
    if (!checkOldPassword) {
      throw new BadRequestException('Old password is incorrect');
    }

    const samePassword = await bcrypt.compare(newPassword, checkUser.password);
    if (samePassword) {
      throw new BadRequestException('New password cannot be the same as the current password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
        status: 'ACTIVE'
      },
      data: {
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true,
      }
    });
    return updatedUser;
  }
}
