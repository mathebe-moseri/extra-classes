import { Component, AfterViewInit, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { words } from '../../constants';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import { NavComponent } from '../../shared/nav/nav.component';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, NavComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements AfterViewInit {

  words = words;

  @ViewChildren('slideWord') slideWordElements!: QueryList<ElementRef>;
  @ViewChild('rotateIcon', {static: false})rotateIcon!: ElementRef<HTMLImageElement>;

  ngAfterViewInit() {

  }

    printCV() {
    const cvElement = document.getElementById('resume') as HTMLElement;

    const options = {
      margin: 0,
      filename: 'Mathebe_Conny_Moseri_CV.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 1.5, useCORS: true },
      jsPDF: {
        unit: 'pt' as const,
        format: 'a4' as const,
        orientation: 'landscape' as const
      },
      pagebreak: { mode: ['css', 'legacy'] }

    };

    html2pdf().from(cvElement).set(options).save();
  }


}
