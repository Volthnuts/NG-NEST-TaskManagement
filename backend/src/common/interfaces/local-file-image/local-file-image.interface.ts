// สร้าง Interface กำหนดโครงสร้างออปชันที่เราอยากจะส่งเข้าไป
export interface LocalFilesInterceptorOptions {
  fieldName: string;
  destination: string;
  allowedMimeTypes?: string[];
  maxSizeInBytes?: number;
}