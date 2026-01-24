import { Component } from '@angular/core';
import { HeroComponent } from '../sections/hero/hero.component';
import { ResumeComponent } from '../sections/resume/resume.component';
import { NavComponent } from '../shared/nav/nav.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [HeroComponent, ResumeComponent, NavComponent, CommonModule,FormsModule],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {}