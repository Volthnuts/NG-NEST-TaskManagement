import { Component } from '@angular/core';
import { SharedModule } from '../../shared-modules';

@Component({
  selector: 'app-auth-layout',
  imports: [
    SharedModule
  ],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {}
