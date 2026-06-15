import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateProjectDto {
    @IsNotEmpty({ message: 'Project name cannot be null' })
    @IsString({ message: 'Project name must be a string' })
    name!: string;

    @IsOptional()
    @IsString({ message: 'Project description must be a string' })
    description?: string;
}
