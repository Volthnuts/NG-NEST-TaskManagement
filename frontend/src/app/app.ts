import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Theme } from './shared/theme/theme';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Theme
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
}
