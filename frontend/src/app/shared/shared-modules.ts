import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  heroChevronDoubleUp, 
  heroEye, 
  heroEyeSlash, 
  heroMoon, 
  heroSun, 
  heroUser 
} from '@ng-icons/heroicons/outline';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterOutlet,
    NgIconComponent,
    RouterLink
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterOutlet,
    NgIconComponent,
    RouterLink
  ],
  providers: [
    provideIcons({
      heroMoon,
      heroSun,
      heroUser,
      heroEye,
      heroEyeSlash,
      heroChevronDoubleUp
    })
  ]
})

export class SharedModule {}