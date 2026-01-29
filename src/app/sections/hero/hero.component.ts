import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../../shared/nav/nav.component';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, NavComponent, FormsModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements AfterViewInit {

  /* ---------------- QUIZ STATE ---------------- */
  showQuiz = false;
  showQuizCompletedPopup = false;
  userAnswer: number | null = null;
  feedback = '';
  isCorrect = false;
  imageLoaded = false;
  quizCompleted = false;
  totalCorrect = 0;

  currentQuestionIndex = 0;
  currentQuestion: any;
  completedMessage = ''

  subjectsDropdownOpen = false;



  /* ---------------- QUIZ QUESTIONS ---------------- */
  quizQuestions = [
    {
      text: 'In a right-angled triangle, if angle θ is 30° and the hypotenuse is 10 units, find the length of the opposite side.',
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
    this.quizQuestions.forEach(q => {
      if (q.image) {
        const img = new Image();
        img.src = q.image;
      }
    });
  }
  /* ---------------- QUIZ METHODS ---------------- */
  openQuiz() {
    this.currentQuestionIndex = 0;
    this.loadQuestion();
    this.showQuiz = true;
  }

  closeQuiz() {
    this.showQuiz = false;
    this.feedback = '';
    this.userAnswer = null;
    this.isCorrect = false;
    this.quizCompleted = false;
  }

  loadQuestion() {
    this.currentQuestion = this.quizQuestions[this.currentQuestionIndex];
    this.userAnswer = null;
    this.feedback = '';
    this.isCorrect = false;
    this.imageLoaded = false; // ✅ RESET IMAGE STATE
  }

  checkAnswer() {
    if (this.userAnswer === null) return;

    if (Math.abs(this.userAnswer - this.currentQuestion.answer) < 0.05) {
      this.feedback = '✅ Correct! Well done.';
      this.isCorrect = true;
      this.totalCorrect++;
    } else {
      this.feedback = `❌ Incorrect. Correct answer is ${this.currentQuestion.answer}`;
      this.isCorrect = false;
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.quizQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.loadQuestion();
    } else {
      // Quiz completed
      this.quizCompleted = true;
      const scorePercent = (this.totalCorrect / this.quizQuestions.length) * 100;

      // Hide the normal quiz content and show the completed popup
      this.showQuiz = false;
      this.showQuizCompletedPopup = true;


      // Set feedback message for the popup
      this.completedMessage = `🎉 You completed the quiz! You passed with ${scorePercent.toFixed(0)}%`;
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
    this.tryAgain(); // resets quiz if needed
  }

  downloadPDF() {
    const link = document.createElement('a');
    link.href = 'test.pdf';
    link.download = 'SesiMathebe-Extra Classes.pdf';
    link.click();
  }

  toggleSubjectsDropdown() {
    this.subjectsDropdownOpen = !this.subjectsDropdownOpen;
  }

  closeSubjectsDropdown() {
    this.subjectsDropdownOpen = false;
  }

  scrollToAbout() {
  const el = document.getElementById('about-us');
  if (el) {
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

}

