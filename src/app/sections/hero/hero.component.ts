import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../../shared/nav/nav.component';
import { FormsModule } from '@angular/forms';
import html2pdf from 'html2pdf.js';
import { ResumeComponent } from '../resume/resume.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, NavComponent, FormsModule, ResumeComponent],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements AfterViewInit {

  showQuiz = false;
  userAnswer: number | null = null;
  feedback = '';
  isCorrect = false;

  // Example quiz values
  quizAngle = 30;
  quizHypotenuse = 10;

  ngAfterViewInit() {
    // Any GSAP animations can go here
  }

  openQuiz() {
    this.showQuiz = true;
    this.userAnswer = null;
    this.feedback = '';
  }

  closeQuiz() {
    this.showQuiz = false;
    this.feedback = '';
  }

  checkAnswer() {
    if (this.userAnswer === null) return;

    const correctAnswer = this.quizHypotenuse * Math.sin(this.quizAngle * Math.PI / 180);

    if (Math.abs(this.userAnswer - correctAnswer) < 0.01) {
      this.feedback = '✅ Correct! Well done!';
      this.isCorrect = true;
    } else {
      this.feedback = '❌ Incorrect. Hint: Opposite = hypotenuse × sin(θ)';
      this.isCorrect = false;
    }
  }

  printCV() {
    const cvElement = document.getElementById('resume') as HTMLElement;

    const options = {
      margin: 0,
      filename: 'Mathebe_Conny_Moseri_CV.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 1.5, useCORS: true },
      jsPDF: { unit: 'pt' as const, format: 'a4' as const, orientation: 'landscape' as const },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    html2pdf().from(cvElement).set(options).save();
  }

downloadPDF() {
  const link = document.createElement('a');
  link.href = 'test.pdf'
  link.download = 'SesiMathebe-Extra Classes.pdf'; // name of downloaded file
  link.click();
}


}






