import { Routes } from '@angular/router';
import { Register } from './features/auth/register/register';
import { Login } from './features/auth/login/login';
import { AuthLayout } from './shared/layouts/auth-layout/auth-layout';
import { MainLayout } from './shared/layouts/main-layout/main-layout';
import { SelectOrCreateProject } from './features/project/select-or-create-project/select-or-create-project';
import { CreateProject } from './features/project/create-project/create-project';
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
                path: 'resetPassword', 
                loadComponent: () => ResetPassword,
                canActivate: [authGuard] // ล็อกหน้านี้ไว้ ต้องล็อกอินก่อนถึงเข้าได้ 
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
        path: 'workspace',
        component: MainLayout,
        canActivate: [authGuard], // ล็อกหน้านี้ไว้ ต้องล็อกอินก่อนถึงเข้าได้
        children: [
            { 
                path: '', 
                redirectTo: 'tasks', 
                pathMatch: 'full' 
            },
            { 
                path: 'tasks', 
                component: ProjectTaskList // จะมาโผล่ตรง <router-outlet> ของ MainLayout ทันที
            },
            // ในอนาคตคุณสามารถมาเปิดทางให้หน้าแก้ไขหรือหน้าจัดการสมาชิกเพิ่มตรงนี้ได้:
            {   
                path: 'edit', 
                component: EditProject 
            },
            { 
                path: 'members', 
                component: MemberInProject 
            }
        ]
    },
    {
        path: 'workspace/task',
        component: MainLayout,
        canActivate: [authGuard], // ล็อกหน้านี้ไว้ ต้องล็อกอินก่อนถึงเข้าได้
        children: [
            { 
                path: '', 
                redirectTo: 'tasks', 
                pathMatch: 'full' 
            },
            { 
                path: 'create', 
                component: CreateTask // จะมาโผล่ตรง <router-outlet> ของ MainLayout ทันที
            },
            // ในอนาคตคุณสามารถมาเปิดทางให้หน้าแก้ไขหรือหน้าจัดการสมาชิกเพิ่มตรงนี้ได้:
            {   
                path: 'edit', 
                component: EditTask 
            }
        ]
    },
    {
        path: 'user',
        component: MainLayout,
        canActivate: [authGuard], // ล็อกหน้านี้ไว้ ต้องล็อกอินก่อนถึงเข้าได้
        children: [
            { 
                path: '', 
                redirectTo: 'tasks', 
                pathMatch: 'full' 
            },
            { 
                path: 'profile', 
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