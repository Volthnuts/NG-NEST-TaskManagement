import { Component, Input } from '@angular/core';
import { SharedModule } from '../shared-modules';

@Component({
  selector: 'app-loading-page',
  imports: [
    SharedModule
  ],
  templateUrl: './loading-page.html',
  styleUrl: './loading-page.scss',
})
export class LoadingPage {
  @Input() isLoading: boolean = false; 
  // ช่องรับข้อความ เผื่อหน้าไหนอยากให้ขึ้นคำอื่น เช่น "Saving...", "Deleting..."
  @Input() text: string = 'Please wait...';
}
