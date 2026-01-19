import { Component } from '@angular/core';
import { AppComponent } from '../app.component';
import { HeroComponent } from '../sections/hero/hero.component';
import { ResumeComponent } from '../sections/resume/resume.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [AppComponent, HeroComponent, ResumeComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {

}
