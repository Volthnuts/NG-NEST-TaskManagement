import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class ResetPasswordDto {
    @IsNotEmpty({ message: 'Token cannot be null' })
    token!: string;

    @IsNotEmpty({ message: 'Password cannot be null' })
    @IsString({ message: 'Password must be a string' }) 
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
        { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' })
    newPassword!: string; 

    @IsNotEmpty({ message: 'Confirm Password cannot be null' })
    @IsString({ message: 'Confirm Password must be a string' })
    confirmPassword!: string;
}
