import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { HeroComponent } from '../sections/hero/hero.component';

import { NavComponent } from '../shared/nav/nav.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AboutUSComponent } from '../sections/about-us/about-us.component';


@Component({
  selector: 'app-main',
  standalone: true,
  imports: [HeroComponent, NavComponent, CommonModule, FormsModule, AboutUSComponent, RouterOutlet],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {
  constructor(private router: Router) { }

  // true only on the home page ("/")
  get isHome(): boolean {
    return this.router.url.split(/[?#]/)[0] === '/';
  }
}
