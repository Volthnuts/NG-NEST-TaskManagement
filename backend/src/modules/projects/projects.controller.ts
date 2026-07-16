import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Put, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles/roles.guard';
import type { RequestWithUser } from 'src/common/interfaces/request-with-user/request-with-user.interface';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(
    @Req() request: RequestWithUser,
    @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(request.user.userId, createProjectDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getAllProjects(
    @Req() request: RequestWithUser) {
    return this.projectsService.getAllProjects(request.user.userId);
  }
  
  @Roles('OWNER','MEMBER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':projectId')
  getOneProject(
    @Param('projectId') projectId: string) {
    return this.projectsService.getOneProject(projectId);
  }

  @Roles('OWNER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':projectId')
  updateProject(
    @Param('projectId') projectId: string, 
    @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.updateProject(projectId, updateProjectDto);
  }

  @Roles('OWNER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':projectId')
  deleteProject(
    @Param('projectId') projectId: string) {
    return this.projectsService.deleteProject(projectId);
  }

  @Roles('OWNER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':projectId/users')
  allUsers(
    @Param('projectId') projectId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    // แปลงค่า string จาก query ให้เป็นตัวเลขสำหรับทำคณิตศาสตร์ของ DB
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    return this.projectsService.allUsers(projectId, skip, take, search);
  }

  @Roles('OWNER', 'MEMBER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':projectId/members')
  allMembers(
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.allMembers(projectId);
  }

  @Roles('OWNER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':projectId/add-member')
  addMember(
      @Param('projectId') projectId: string,
      @Body('memberId') memberId: string
  ) {
    return this.projectsService.addMember(memberId,projectId);
  }

  @Roles('OWNER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':projectId/delete-member/:memberId')
  deleteMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string
  ) {
    return this.projectsService.deleteMember(memberId, projectId);
  }

  @Roles('OWNER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':projectId/change-owner')
  changeOwner(
    @Param('projectId') projectId: string,
    @Body() body: { 
      memberId: string; 
      ownerId: string 
    }
  ) {
    const { ownerId, memberId } = body;
    return this.projectsService.changeOwner(ownerId, memberId, projectId);
  }
}
