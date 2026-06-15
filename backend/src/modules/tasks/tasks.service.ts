import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { RequestWithUser } from 'src/common/interfaces/request-with-user/request-with-user.interface';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class TasksService {

  constructor(
    private prisma: PrismaService
  ) {}

  async create(
    userId: string,
    createTaskDto: CreateTaskDto,
    projectId: string
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        status: 'ACTIVE'
      }
    })

    if(!user){
      throw new NotFoundException('User not found')
    }

    const { title, description, status, priority, dueDate, assigneeId } = createTaskDto;

    const createdTask = await this.prisma.task.create({
      data: {
        title: title,
        description: description,
        status: status,       
        priority: priority,  
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId,   
        createdById: userId,  
        assigneeId: assigneeId || null 
      }
    });

    return createdTask;
  }

  async findAll(
    projectId: string
  ) {
    const allTasks = await this.prisma.task.findMany({
      where: {
        projectId: projectId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return allTasks
  }

  async findOne(
    taskId: string,
    userId: string
  ) {
    const thisTask = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      }
    })

    if(!thisTask){
      throw new NotFoundException('Task not found')
    }

    return {
      ...thisTask,
      isCreator: thisTask.createdById === userId
    }
  }

  async update(
    taskId: string, 
    userId: string, 
    updateTaskDto: UpdateTaskDto
  ) {
    const thisTask = await this.prisma.task.findUnique({
      where: {
        id: taskId
      }
    })

    if(!thisTask){
      throw new NotFoundException('Task not found')
    }

    const isCreator = thisTask.createdById === userId;
    const isAssignee = thisTask.assigneeId === userId;

    if (!isCreator && !isAssignee) {
      throw new ForbiddenException('You do not have permission to update this task');
    }

    const updatedTask = await this.prisma.task.update({
      where: {
        id: taskId
      },
      data: updateTaskDto
    })

    return updatedTask
  }

  async remove(
    taskId: string,
    userId: string
  ) {
    const checkTask = await this.prisma.task.findUnique({
      where: {
        id: taskId
      }
    })

    if(!checkTask){
      throw new NotFoundException('Task not found')
    }

    const isCreator = checkTask.createdById === userId;
    const projectMemberRole = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: checkTask.projectId, 
          userId: userId                  
        }
      }
    });
    const isProjectOwner = projectMemberRole?.role === 'OWNER';
    if (!isCreator && !isProjectOwner) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    await this.prisma.task.delete({
      where: {
        id: taskId
      }
    })

    return {
      message: `Delete task ${checkTask.title} successfully`
    }
  }
}
