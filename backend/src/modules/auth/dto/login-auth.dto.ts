import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class LoginAuthDto {
    @IsNotEmpty({ message: 'Email cannot be null' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    email!: string; // ใส่ ! เพื่อบอกว่าจะมีค่ามาแน่นอน

    @IsNotEmpty({ message: 'Password cannot be null' })
    @IsString({ message: 'Password must be a string' }) 
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
        { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' })
    password!: string; 
}