import { Routes } from '@angular/router';
import { Register } from './features/auth/register/register';
import { Login } from './features/auth/login/login';
import { AuthLayout } from './shared/layouts/auth-layout/auth-layout';
import { MainLayout } from './shared/layouts/main-layout/main-layout';
import { ProjectTaskList } from './features/project/project-task-list/project-task-list';
import { EditProject } from './features/project/edit-project/edit-project';
import { MemberInProject } from './features/project/member-in-project/member-in-project';
import { CreateTask } from './features/task/create-task/create-task';
import { EditTask } from './features/task/edit-task/edit-task';
import { UserProfile } from './features/user/user-profile/user-profile';
import { authGuard } from './core/auth/auth.guard';
import { VerifyEmail } from './features/auth/verify-email/verify-email';
import { ForgotPassword } from './features/auth/forgot-password/forgot-password';
import { ResetPassword } from './features/auth/reset-password/reset-password';
import { SelectOrCreateProject } from './features/project/select-or-create-project/select-project/select-or-create-project';
import { CreateProject } from './features/project/select-or-create-project/create-project/create-project';
import { ChangePassword } from './features/auth/change-password/change-password';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: '',
        component: AuthLayout,
        children: [
            { 
                path: 'login', 
                loadComponent: () => Login
            },
            { 
                path: 'register', 
                loadComponent: () => Register 
            },
            { 
                path: 'verifyEmail', 
                loadComponent: () => VerifyEmail 
            },
            { 
                path: 'forgotPassword', 
                loadComponent: () => ForgotPassword 
            },
            { 
                path: 'changePassword', 
                loadComponent: () => ChangePassword 
            },
            { 
                path: 'resetPassword', 
                loadComponent: () => ResetPassword,
                // canActivate: [authGuard] 
            },
            { 
                path: 'projetSelect', 
                loadComponent: () => SelectOrCreateProject,
                canActivate: [authGuard] // ล็อกหน้านี้ไว้ ต้องล็อกอินก่อนถึงเข้าได้
            },
            { 
                path: 'projetCreate', 
                loadComponent: () => CreateProject,
                canActivate: [authGuard] // ล็อกหน้านี้ไว้ ต้องล็อกอินก่อนถึงเข้าได้
            }
        ]
    },
    {
        path: 'workspace/:projectId', // 💡 ใช้ทางเข้าหลักตัวนี้คุมสเปซของโปรเจกต์นั้นทั้งหมด
        component: MainLayout,
        canActivate: [authGuard],
        children: [
            { 
                path: '', 
                redirectTo: 'tasks', 
                pathMatch: 'full' 
            },
            // --- หมวดจัดการเกี่ยวกับงาน (Tasks) ---
            { 
                path: 'tasks', 
                component: ProjectTaskList // แสดงตารางรวมงาน -> URL: /workspace/:projectId/tasks
            },
            { 
                path: 'tasks/create', 
                component: CreateTask // หน้าสร้างงานใหม่ -> URL: /workspace/:projectId/tasks/create
            },
            {   
                path: 'tasks/edit/:taskId', 
                component: EditTask // หน้าแก้ไขงาน -> URL: /workspace/:projectId/tasks/edit/:taskId
            },
            // --- หมวดตั้งค่าโปรเจกต์ (Project Management) ---
            {   
                path: 'edit', 
                component: EditProject // แก้ไขโปรเจกต์ -> URL: /workspace/:projectId/edit
            },
            { 
                path: 'members', 
                component: MemberInProject // จัดการสมาชิก -> URL: /workspace/:projectId/members
            },
            // --- หมวดผู้ใช้ ---
            { 
                path: 'user/my-profile', 
                component: UserProfile 
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];