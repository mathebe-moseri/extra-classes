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

    const tl = gsap.timeline({ repeat: -1 });

    this.slideWordElements.forEach((el, index) => {
      gsap.set(el.nativeElement, { opacity: 0, position: 'absolute', left: 0, top: 0 });

      tl.fromTo(
        el.nativeElement,
        { x: '-50%', opacity: 0 },
        { x: '0%', opacity: 1, duration: 2, ease: 'power1.out', yoyo: true }
      )
        .to(
          el.nativeElement,
          { x: '100%', opacity: 0, duration: 3, ease: 'power1.in', delay: 0, yoyo: true }
        );

    });

    gsap.to(this.rotateIcon.nativeElement, {
      rotation: 360,
      repeat: -1,
      duration: 6,
      ease: "none",
      yoyo: true
      
    })

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
