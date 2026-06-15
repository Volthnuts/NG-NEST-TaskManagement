import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { TaskStatus, TaskPriority } from '@prisma/client'; // อิมพอร์ต Enum มาจาก Prisma ตรงๆ

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus; 

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority; 

  @IsDateString() 
  dueDate?: string;

  @IsUUID()
  @IsOptional()
  assigneeId?: string; 
}