import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// const prisma = new PrismaClient();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. สร้าง User ทดสอบ
  const hashedPassword = await bcrypt.hash('Test@1234', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'alice@test.com' },
    update: {},
    create: {
      name: 'Alice',
      email: 'alice@test.com',
      password: hashedPassword,
      status: 'ACTIVE', // ข้ามขั้นตอน verify email
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@test.com' },
    update: {},
    create: {
      name: 'Bob',
      email: 'bob@test.com',
      password: hashedPassword,
      status: 'ACTIVE',
    }
  });

  const users = Array.from({ length: 30 }, (_, i) => ({
    name: `User${i + 1}`,
    email: `user${i + 1}@test.com`,
  }));

  await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: {
          email: user.email,
        },
        update: {},
        create: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          status: 'ACTIVE',
        },
      })
    )
  );
  
  // 2. สร้าง Project ทดสอบ
  const project = await prisma.project.create({
    data: {
      name: 'TaskFlow MVP',
      description: 'โปรเจกต์ทดสอบระบบ',
      members: {
        create: [
          { userId: user1.id, role: 'OWNER' },
          { userId: user2.id, role: 'MEMBER' },
        ]
      }
    }
  });

  // 3. สร้าง Task ทดสอบ
  await prisma.task.createMany({
    data: [
      {
        title: 'ออกแบบ UI หน้า Login',
        status: 'DONE',
        priority: 'HIGH',
        projectId: project.id,
        createdById: user1.id,
        assigneeId: user1.id,
      },
      {
        title: 'เชื่อม API Register',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        projectId: project.id,
        createdById: user1.id,
        assigneeId: user2.id,
      },
      {
        title: 'เขียน Unit Test',
        status: 'OPEN',
        priority: 'MEDIUM',
        projectId: project.id,
        createdById: user2.id,
      }
    ]
  });

  console.log('✅ Seed สำเร็จ!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());