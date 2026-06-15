import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles/roles.guard';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import type { RequestWithUser } from 'src/common/interfaces/request-with-user/request-with-user.interface';

@Controller(':projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Roles('OWNER','MEMBER') 
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto,
    @Req() request: RequestWithUser
  ) {
    return this.tasksService.create(request.user.userId,createTaskDto,projectId);
  }

  @Roles('OWNER','MEMBER')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Get()
  findAll(
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.findAll(projectId);
  }

  @Roles('OWNER','MEMBER')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Get(':taskId')
  findOne(
    @Param('taskId') taskId: string,
    @Req() request: RequestWithUser,
  ) {
    return this.tasksService.findOne(taskId,request.user.userId);
  }

  @Roles('OWNER','MEMBER') 
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Patch(':taskId')
  update(
    @Param('taskId') taskId: string,
    @Req() request: RequestWithUser,
    @Body() updateTaskDto: UpdateTaskDto
  ) {
    return this.tasksService.update(taskId,request.user.userId,updateTaskDto);
  }

  @Roles('OWNER','MEMBER') 
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Delete(':taskId')
  remove(
    @Param('taskId') taskId: string,
    @Req() request: RequestWithUser,
  ) {
    return this.tasksService.remove(taskId,request.user.userId);
  }
}
