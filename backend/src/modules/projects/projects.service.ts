import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService
  ) {}

  async create(userId: string, createProjectDto: CreateProjectDto) {
    const { name, description } = createProjectDto;

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ใช้ความสามารถ Nested Create ของ Prisma สั่งสร้าง Project พร้อมผูก ProjectMember ในรอบเดียว
    const createdProject = await this.prisma.project.create({
      data: {
        name,
        description,
        // สั่งสร้างตาราง projectMember ผูกไปด้วยทันทีแบบอัตโนมัติ
        // Project สัมพันธ์กับ ProjectMember ผ่านชื่อ members
        members: {
          create: {
            userId: userId,
            role: 'OWNER' // ไม่ต้องใส่ projectId เพราะ Prisma จะเอา ID ของโปรเจกต์ที่เพิ่งสร้างเสร็จมายัดให้เอง
          }
        }
      }
    });

    // แกะ id แยกออกมา ส่วนที่เหลือรวบไปเก็บไว้ใน projectWithoutId
    const { id, ...projectWithoutId } = createdProject;

    return projectWithoutId;
  }

  async getAllProjects(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        members: { // members คือชื่อ relation ที่เชื่อมตาราง project กับ projectMember
          some: { // some คือเงื่อนไขที่ต้องการให้มีอย่างน้อย 1 แถวในตาราง projectMember ที่เชื่อมโยงกับโปรเจกต์นี้
            userId: userId
          }
        }
      },
      // แถมข้อมูลบทบาทของเราในโปรเจกต์นั้นกลับไปด้วย
      include: {
        members: {
          where: {
            userId: userId // ดึงมาเฉพาะแถวที่เป็นของเราคนเดียวพอ ไม่ต้องดึงเพื่อนร่วมทีมทั้งหมด
          },
          select: {
            role: true // เอาแค่ฟิลด์ role (OWNER/MEMBER)
          }
        }
      }
    });

    return projects;
  }

  async getOneProject(projectId: string) {
    const checkProject = await this.prisma.project.findUnique({
      where: {
        id: projectId
      }
    });

    if (!checkProject) {
      throw new NotFoundException('Project not found');
    }

    return checkProject;
  }

  async updateProject(projectId: string, updateProjectDto: UpdateProjectDto) {
    const checkProject = await this.prisma.project.findUnique({
      where: {
        id: projectId
      }
    });

    if (!checkProject) {
      throw new NotFoundException('Project not found');
    }

    const updatedProject = await this.prisma.project.update({
      where: {
        id: projectId
      },
      data: updateProjectDto
    });

    return updatedProject;
  }

  async deleteProject(projectId: string) {
    const checkProject = await this.prisma.project.findUnique({
      where: {
        id: projectId
      }
    });

    if (!checkProject) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.project.delete({
      where: {
        id: projectId
      }
    });

    return { 
      message: `Project ${checkProject.name} has been deleted successfully` 
    };
  }

  async allUsers(projectId: string) {
    const users = await this.prisma.user.findMany({
      where : {
        status: 'ACTIVE' // เลือก user ทั้งหมดที่ active
      },select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          projects: { // เลือกความสัมพันธ์ที่ตั้งไว้ที่ต่อกับ ProjectMember
            where: {
              projectId: projectId // ในตาราง ProjectMember อาจจะมี 
              // user1 -> projectId1
              // user1 -> projectId2
              // จึงต้องเลือกที่ projectId ที่ส่งมาอันเดียว
            },select: {
                role: true
            }
          }
      }
    });

    // รูปแบบข้อมูลที่ออกมา
    // {
    //   "name": "นาย A",
    //   "projects": [
    //     { 
    //        "role": "MEMBER" 
    //     }   
    //   ]
    // } ต้องเอาไป format ให้เป็น "name": "นาย A", "role": "MEMBER"

    const formattedAllUsers = users.map(user => {
      // let จะอยู่แต่ข้างในนี้ ถ้าใช้ var ประกาศตัวแปร ถ้าไปเรียกชื่อซ้ำในฟังก์ชันอื่น ค่าอาจจะเพี้ยน
      // เช็กสั้นๆ ว่าอาร์เรย์ projects มีข้อมูลผูกอยู่ไหม
      const hasRole = user.projects.length > 0;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        //ถ้า hasRole เป็นจริง -> เอาค่าตัวแรกมา : ถ้าเป็นเท็จ -> ให้เป็น 'NONE'
        role: hasRole ? user.projects[0].role : 'NONE', 
      };
    });

    return formattedAllUsers;
  }

  async allMembers(projectId: string) {
  const users = await this.prisma.user.findMany({
    where: {
      status: 'ACTIVE', // กรองเฉพาะคนที่ยัง Active (ถ้าต้องการ)
      projects: {
        some: { // some คือ ถ้ามีสักอันที่ตรงตามเงื่อนไข มันจะมี every กับ none ด้วย
          // every คือ ต้องมีแค่ project นี้อย่างเดียว **ไม่ใช้เพราะ user อยู่หลาย project
          // none คือ ไม่อยู่ใน project นี้ หรือไม่เกี่ยวข้องเลย **ไม่ได้ใช้อยู่ดี
          projectId: projectId // ค้นหาใน Relation Table (ProjectMember) ว่าตรงกับ ID นี้ไหม
        }
      }
    },select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true
    }
  });

  return users; // ได้ Array ของ User สองมิติตามที่ต้องการทันที
}

  async addMember(memberId: string, projectId: string) {
    
    // findFirst เพื่อให้กรองสถานะ status: 'ACTIVE' ร่วมกับ id ได้
    const checkMember = await this.prisma.user.findFirst({
      where: {
        id: memberId,
        status: 'ACTIVE',
      },
    });

    // ถ้าไม่เจอผู้ใช้คนนี้ หรือผู้ใช้ไม่ได้มีสถานะ ACTIVE จะดีดเออเรอร์กลับไปทันที
    if (!checkMember) {
      throw new NotFoundException('User not found or is inactive');
    }

    // เพิ่มก้อน data: { ... } ครอบข้อมูลที่จะบันทึกลงตาราง ProjectMember
    const addedMember = await this.prisma.projectMember.create({
      data: {
        projectId: projectId,
        userId: memberId,
        role: 'MEMBER', // กำหนดค่าเริ่มต้นเป็นสมาชิกทั่วไป
      },
    });

    return addedMember; 
  }

  async deleteMember(memberId: string, projectId: string) {
    const checkMember = await this.prisma.user.findFirst({
      where: {
        id: memberId,
        status: 'ACTIVE',
      },
    });

    if (!checkMember) {
      throw new NotFoundException('User not found or is inactive');
    }

    // ถ้าพิมพ์ where: { userId: memberId, projectId: projectId } ตรงๆ
    // Prisma จะมองว่ามันเป็นแค่การส่งฟิลด์ธรรมดา 2 ฟิลด์มาชนกัน 
    // ซึ่งตัวระบบไม่การันตีความปลอดภัย มันเลยจะขึ้นตัวแดงบล็อกเราทันที
    await this.prisma.projectMember.delete({
      where: {
        projectId_userId: { // ใช้ตัวนี้ เพราะเราสร้าง unique index ไว้แล้ว
          userId: memberId,
          projectId: projectId
        }
      }
    })

    return {
      message: `Delete Member ${checkMember.name} Successfully`
    };
  }
}
