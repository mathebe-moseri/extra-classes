import { Component, AfterViewInit, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JoinFormService } from '../../join-form.service';
import { RevealDirective } from '../../shared/reveal.directive';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements OnInit, AfterViewInit {

  /* ---------------- QUIZ STATE ---------------- */
  showQuiz = false;
  showQuizCompletedPopup = false;
  userAnswer: number | null = null;
  feedback = '';
  isCorrect = false;
  answered = false;            // NEW: true once the learner has checked an answer
  imageLoaded = false;
  quizCompleted = false;
  totalCorrect = 0;

  currentQuestionIndex = 0;
  currentQuestion: any;
  completedMessage = '';

  copied = false;              // NEW: shows "Copied" on the account number button

  constructor(private joinForm: JoinFormService) { }

  ngOnInit() {
    // Hamburger menu "Testimonials" -> open the testimonials popup
    this.joinForm.testimonialsRequested$.subscribe(() => this.openTestimonials());
  }

  openJoin() {
    this.joinForm.open();
  }

  openLogin() {
    this.joinForm.openLogin();
  }

  scrollToApply() {
    document.getElementById('apply-video')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // NEW
  scrollToAbout() {
    document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // NEW
  async copyAccount() {
    try {
      await navigator.clipboard.writeText('9388305991');
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    } catch {
      /* clipboard blocked: the number is still on screen to copy by hand */
    }
  }

  // NEW: Escape closes whichever popup is open
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showQuiz) this.closeQuiz();
    else if (this.showQuizCompletedPopup) this.closeQuizCompletedPopup();
    else if (this.showTestimonials) this.closeTestimonials();
  }

  /* ---------------- QUIZ QUESTIONS ---------------- */
  quizQuestions = [
    {
      text: 'What is a triangle?',
      answer: +(10 * Math.sin(30 * Math.PI / 180)).toFixed(2),
      image: '/images/img1.png'
    },
    {
      text: 'In a right-angled triangle, the opposite side is 5 units and the hypotenuse is 13 units. Find sin θ.',
      answer: +(5 / 13).toFixed(2),
      image: '/images/img2.png'
    },
    {
      text: 'In a right-angled triangle, if angle θ is 60° and the hypotenuse is 12 units, find the length of the adjacent side.',
      answer: +(12 * Math.cos(60 * Math.PI / 180)).toFixed(2),
      image: '/images/img3.png'
    },
    { text: 'In a right-angled triangle, if angle θ is 45° and the hypotenuse is 14 units, find the length of the opposite side.', answer: +(14 * Math.sin(45 * Math.PI / 180)).toFixed(2) },
    { text: 'In a right-angled triangle, if angle θ is 35° and the adjacent side is 8 units, find the length of the hypotenuse.', answer: +(8 / Math.cos(35 * Math.PI / 180)).toFixed(2) },
    { text: 'In a right-angled triangle, if the opposite side is 6 units and the adjacent side is 8 units, find tan θ.', answer: +(6 / 8).toFixed(2) },
    { text: 'In a right-angled triangle, if sin θ = 0.5, find the value of θ.', answer: 30 },
    { text: 'In a right-angled triangle, if cos θ = 0.866, find the value of θ.', answer: 30 },
    { text: 'In a right-angled triangle, the hypotenuse is 20 units and angle θ is 25°. Find the length of the adjacent side.', answer: +(20 * Math.cos(25 * Math.PI / 180)).toFixed(2) },
    { text: 'In a right-angled triangle, the opposite side is 7 units and the hypotenuse is 14 units. Find cos θ.', answer: +(Math.sqrt(14 ** 2 - 7 ** 2) / 14).toFixed(2) },
    { text: 'In a right-angled triangle, the adjacent side is 9 units and angle θ is 40°. Find the opposite side.', answer: +(9 * Math.tan(40 * Math.PI / 180)).toFixed(2) },
    { text: 'If sin θ = 0.6 and cos θ = 0.8 in a right-angled triangle, find tan θ.', answer: +(0.6 / 0.8).toFixed(2) },
    { text: 'In a right-angled triangle, angle θ is 50° and hypotenuse is 15 units. Find the opposite side.', answer: +(15 * Math.sin(50 * Math.PI / 180)).toFixed(2) }
  ];

  ngAfterViewInit() {
    this.quizQuestions.forEach((q: any) => {
      if (q.image) {
        const img = new Image();
        img.src = q.image;
      }
    });
  }

  /* ---------------- QUIZ METHODS ---------------- */
  openQuiz() {
    this.currentQuestionIndex = 0;
    this.totalCorrect = 0;
    this.loadQuestion();
    this.showQuiz = true;
  }

  closeQuiz() {
    this.showQuiz = false;
    this.feedback = '';
    this.userAnswer = null;
    this.isCorrect = false;
    this.answered = false;
    this.quizCompleted = false;
  }

  loadQuestion() {
    this.currentQuestion = this.quizQuestions[this.currentQuestionIndex];
    this.userAnswer = null;
    this.feedback = '';
    this.isCorrect = false;
    this.answered = false;
    this.imageLoaded = false;
  }

  checkAnswer() {
    if (this.userAnswer === null || this.answered) return;
    this.answered = true;

    if (Math.abs(this.userAnswer - this.currentQuestion.answer) < 0.05) {
      this.feedback = '✅ Correct! Well done.';
      this.isCorrect = true;
      this.totalCorrect++;
    } else {
      this.feedback = `❌ Not quite. The answer is ${this.currentQuestion.answer}`;
      this.isCorrect = false;
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.quizQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.loadQuestion();
    } else {
      this.quizCompleted = true;
      const scorePercent = (this.totalCorrect / this.quizQuestions.length) * 100;
      this.showQuiz = false;
      this.showQuizCompletedPopup = true;
      this.completedMessage =
        `You got ${this.totalCorrect} out of ${this.quizQuestions.length} (${scorePercent.toFixed(0)}%).`;
    }
  }

  tryAgain() {
    this.quizCompleted = false;
    this.totalCorrect = 0;
    this.currentQuestionIndex = 0;
    this.loadQuestion();
  }

  closeQuizCompletedPopup() {
    this.showQuizCompletedPopup = false;
    this.tryAgain();
  }

  downloadPDF() {
    const link = document.createElement('a');
    link.href = 'test.pdf';
    link.download = 'SesiMathebe-Extra Classes.pdf';
    link.click();
  }

  /* ---------------- TESTIMONIALS ---------------- */
  showTestimonials = false;
  currentTestimonial = 0;

  testimonials = [
    { label: 'Learner · Grade 10', src: 'https://pub-160d390f07564ee9a8c40e86ce875025.r2.dev/testimonial1.mp4' },
    { label: 'Learner · Grade 11', src: '' },
    { label: 'Learner · Grade 12', src: '' },
    { label: 'Learner · Grade 12', src: '' },
  ];

  openTestimonials() {
    this.currentTestimonial = 0;
    this.showTestimonials = true;
  }
  closeTestimonials() {
    this.showTestimonials = false;
  }
  selectTestimonial(i: number) {
    this.currentTestimonial = i;
  }
  nextTestimonial() {
    this.currentTestimonial = (this.currentTestimonial + 1) % this.testimonials.length;
  }
  prevTestimonial() {
    this.currentTestimonial =
      (this.currentTestimonial - 1 + this.testimonials.length) % this.testimonials.length;
  }
}