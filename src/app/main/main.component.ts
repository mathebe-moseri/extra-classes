import { Component } from '@angular/core';
import { HeroComponent } from '../sections/hero/hero.component';

import { NavComponent } from '../shared/nav/nav.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AboutUSComponent } from '../sections/about-us/about-us.component';


@Component({
  selector: 'app-main',
  standalone: true,
  imports: [HeroComponent, NavComponent, CommonModule, FormsModule, AboutUSComponent],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {}