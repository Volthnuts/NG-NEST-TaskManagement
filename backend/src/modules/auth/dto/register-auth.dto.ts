import { PartialType } from '@nestjs/mapped-types'; // ถ้าใช้ PartialType() จะทำให้ทุก property ใน RegisterAuthDto เป็น optional
import { LoginAuthDto } from './login-auth.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterAuthDto extends LoginAuthDto {
    @IsNotEmpty({ message: 'Name cannot be null' })
    name!: string;

    @IsNotEmpty({ message: 'Confirm password cannot be null' })
    @IsString({ message: 'Confirm password must be a string' })
    confirmPassword!: string;
}
    