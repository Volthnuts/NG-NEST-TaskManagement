// src/common/interceptors/local-files.interceptor.ts
import { Injectable, NestInterceptor, Type, mixin, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { LocalFilesInterceptorOptions } from 'src/common/interfaces/local-file-image/local-file-image.interface';

// ฟังก์ชันนี้จะรับออปชันและคืนค่าเป็น Interceptor LocalFilesInterceptorOptions ที่ปรับแต่งแล้ว
export function LocalFilesInterceptor(options: LocalFilesInterceptorOptions): Type<NestInterceptor> {
  @Injectable()
  class InterceptorMixin implements NestInterceptor {
    fileInterceptor: NestInterceptor;

    constructor() {
      // ค่าเริ่มต้นถ้าหน้าบ้านไม่ได้กำหนดมา (รูปภาพทั่วไป / ขนาด 2MB)
      const allowedTypes = options.allowedMimeTypes || ['image/jpeg', 'image/jpg', 'image/png'];
      const maxBytes = options.maxSizeInBytes || 1024 * 1024 * 2; 

      const multerOptions: MulterOptions = {
        storage: diskStorage({
          destination: options.destination, // ยืดหยุ่นตามที่ส่งเข้ามา เช่น './uploads/profile-images'
          filename: (req, file, cb) => {
            const randomName = Date.now()+'-'+Math.round(Math.random() * 1E9);
            return cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (!allowedTypes.includes(file.mimetype)) {
            return cb(new BadRequestException(`File type not allowed! Supported: ${allowedTypes.join(', ')}`), false);
          }
          cb(null, true);
        },
        limits: {
          fileSize: maxBytes,
        },
      };

      // ทำการสร้าง FileInterceptor ตัวจริงข้างในด้วยออปชันที่เราปรับแต่งแล้ว
      this.fileInterceptor = new (FileInterceptor(options.fieldName, multerOptions))();
    }

    // สั่งให้ Interceptor ทำงานต่อตามวงจรของ NestJS
    intercept(...args: Parameters<NestInterceptor['intercept']>) {
      return this.fileInterceptor.intercept(...args);
    }
  }

  return mixin(InterceptorMixin);
}