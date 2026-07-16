import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

// ใช้กับ navbar เพื่อเก็บสถานะของโปรเจกต์ปัจจุบันที่ผู้ใช้กำลังดูอยู่ และรายการโปรเจกต์ทั้งหมดที่มี
export class ProjectStateService {
  // เก็บข้อมูลโปรเจกต์ปัจจุบันที่กำลังเปิดดูอยู่
  private currentProjectSubject = new BehaviorSubject<any>(null);
  currentProject$ = this.currentProjectSubject.asObservable();

  // เก็บรายชื่อโปรเจกต์ทั้งหมดที่มี (เอาไว้ให้ Dropdown เลือกสลับ)
  // private allProjectsSubject = new BehaviorSubject<any[]>([]);
  // allProjects$ = this.allProjectsSubject.asObservable();

  setCurrentProject(project: any) {
    this.currentProjectSubject.next(project);
  }

  // setAllProjects(projects: any[]) {
  //   this.allProjectsSubject.next(projects);
  // }
}