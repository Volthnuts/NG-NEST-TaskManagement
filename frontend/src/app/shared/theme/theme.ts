import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../shared-modules';

@Component({
  selector: 'app-theme',
  standalone: true,
  imports: [
    SharedModule
  ],
  templateUrl: './theme.html'
})
export class Theme implements OnInit {

  isDark = false;

  ngOnInit() {
    this.initTheme();
  }

  initTheme() {

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDark = true;
    }
    else if (savedTheme === 'light') {
      this.isDark = false;
    }
    else {
      this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyTheme();
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    this.applyTheme();
  }

  applyTheme() {
    document.documentElement.classList.toggle('dark', this.isDark);
  }

}