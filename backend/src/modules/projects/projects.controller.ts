import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
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
  @Patch(':projectId')
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
  ) {
    return this.projectsService.allUsers(projectId);
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
  @Post('add-member')
  addMember(
    @Body() memberId: string, 
    @Body() projectId: string,
  ) {
    return this.projectsService.addMember(memberId, projectId);
  }

  @Roles('OWNER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':projectId/delete-member')
  deleteMember(
    @Param('projectId') projectId: string,
    @Body() memberId: string
  ) {
    return this.projectsService.deleteMember(memberId, projectId);
  }
}
