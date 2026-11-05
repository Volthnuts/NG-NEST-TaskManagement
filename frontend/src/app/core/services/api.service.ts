import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // 1. อิมพอร์ต map เพิ่มเข้ามาตรงนี้

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://127.0.0.1:8000/api/v1'; 

  private defaultOptions = {
    withCredentials: true
  };

  constructor(private http: HttpClient) {}

  // 2. เพิ่ม .pipe(map(...)) ในทุกๆ Method เพื่อสกัดเอาข้อมูลชั้นในสุดออกไปใช้งาน
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<any>(`${this.baseUrl}${endpoint}`, {
      ...this.defaultOptions,
      params
    }).pipe(
      map(res => this.extractData(res))
    );
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<any>(`${this.baseUrl}${endpoint}`, body, this.defaultOptions).pipe(
      map(res => this.extractData(res))
    );
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<any>(`${this.baseUrl}${endpoint}`, body, this.defaultOptions).pipe(
      map(res => this.extractData(res))
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<any>(`${this.baseUrl}${endpoint}`, this.defaultOptions).pipe(
      map(res => this.extractData(res))
    );
  }

  // 3. ฟังก์ชันตัวกลางสำหรับเช็กโครงสร้างและแกะกล่องข้อมูล
  private extractData(res: any): any {
    // ถ้า Response มีรูปแบบ { success: true, data: { ... } } ให้ส่งค่าใน data ออกไป
    if (res && res.success === true && res.hasOwnProperty('data')) {
      return res.data;
    }
    // ถ้าไม่เข้าเงื่อนไข (หลังบ้านส่งโครงสร้างอื่นมา) ให้คืนค่าแบบเดิมทั้งหมดเพื่อป้องกันระบบพัง
    return res;
  }
}