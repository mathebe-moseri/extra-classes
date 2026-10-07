import { Component, AfterViewInit, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JoinFormService } from '../../join-form.service';
import { RevealDirective } from '../../shared/reveal.directive';
import { smoothScrollToId } from '../../shared/smooth-scroll';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {

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
  selectedOption: number | null = null;

  currentQuestionIndex = 0;
  currentQuestion: any;
  completedMessage = '';

  timeLeft = 0;
  timeTotal = 0;
  private timerId: any = null;

  ngOnDestroy() {
    this.stopTimer();
  }

  private timeFor(q: any): number {
    if (q.time) return q.time;                         // manual override
    if (q.type === 'mcq') {
      const words = [q.text, ...q.options].join(' ').split(/\s+/).length;
      const secs = Math.min(35, Math.max(15, Math.round(8 + words * 0.6)));
      return secs + (q.image ? 5 : 0);                 // extra time to read a diagram
    }
    return 90;                                         // typed calculations
  }

  startTimer() {
    this.stopTimer();
    if (this.isInfoQuestion) return;                   // the definition is not timed
    this.timeTotal = this.timeFor(this.currentQuestion);
    this.timeLeft = this.timeTotal;
    this.timerId = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) this.timeUp();
    }, 1000);
  }

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  timeUp() {
    this.stopTimer();
    if (this.answered) return;
    this.answered = true;
    this.isCorrect = false;
    this.feedback = this.isMcq
      ? `⏰ Time's up! ${this.currentQuestion.explanation}`
      : `⏰ Time's up! The answer is ${this.currentQuestion.answer}`;
  }

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
    smoothScrollToId('apply-video', 'center');
  }

  openContact(type: 'whatsapp' | 'email') {
    this.joinForm.openContactSheet(type);
  }

  // NEW
  scrollToAbout() {
    smoothScrollToId('about-us');
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

  quizQuestions: any[] = [
    /* ---------- LEARN: what is a triangle? ---------- */
    {
      type: 'info',
      text: 'What is a triangle?',
      answer: 'A triangle is a closed shape with three straight sides, three vertices (corners), three angles and the space inside it is called its area.',
      image: '/images/triangle-labelled.svg'
    },

    /* ---------- UNDERSTAND THE DEFINITION ---------- */
    {
      type: 'mcq',
      text: 'How many straight sides does a triangle have?',
      options: ['2', '3', '4', 'It depends on the triangle'],
      correct: 1,
      explanation: 'Every triangle has exactly 3 straight sides. "Tri" means three!'
    },
    {
      type: 'mcq',
      text: 'What is the maths word for a corner?',
      options: ['Side', 'Area', 'Vertex', 'Degree'],
      correct: 2,
      explanation: 'A corner is called a vertex. More than one are called vertices.'
    },
    {
      type: 'mcq',
      text: 'Your friend draws 3 straight lines, but leaves a gap at one corner. Is it a triangle?',
      options: [
        'Yes, any 3 lines make a triangle',
        'Yes, as long as it has 3 corners',
        'Only if all the lines are equal',
        'No, a triangle must be a closed shape'
      ],
      correct: 3,
      explanation: 'A triangle is a closed shape, so all three sides must join up with no gaps.'
    },

    /* ---------- NAME THE PARTS (triangle ABC) ---------- */
    {
      type: 'mcq',
      text: 'Which of the following lists the vertices of triangle ABC?',
      options: ['AB, AC and BC', '1, 2 and 3', 'A, B and C', 'Angle, side and area'],
      correct: 2,
      explanation: 'The vertices (corners) of triangle ABC are the points A, B and C.',
      image: '/images/triangle-abc.svg'
    },
    {
      type: 'mcq',
      text: 'Which of these is a vertex of triangle ABC?',
      options: ['The line BC', 'The shaded space inside', 'Point C', 'The total of 180°'],
      correct: 2,
      explanation: 'Point C is a corner, so it is a vertex.',
      image: '/images/triangle-abc.svg'
    },
    {
      type: 'mcq',
      text: 'Which of these is a side of triangle ABC?',
      options: ['Point A', 'Line AB', 'The shaded space inside', 'The angle at C'],
      correct: 1,
      explanation: 'Line AB is a straight line joining two vertices, so it is a side.',
      image: '/images/triangle-abc.svg'
    },
    {
      type: 'mcq',
      text: 'Sides AB and AC meet at which vertex?',
      options: ['Vertex B', 'Vertex C', 'Vertex A', 'They never meet'],
      correct: 2,
      explanation: 'Both sides start at A, so that is where they meet.',
      image: '/images/triangle-abc.svg'
    },

    /* ---------- SPOT THE PART ---------- */
    {
      type: 'mcq',
      text: 'One side is glowing orange. Which side is it?',
      options: ['Side AB', 'Side AC', 'Side BC', 'Vertex B'],
      correct: 2,
      explanation: 'The orange line runs along the bottom, between B and C. That is side BC.',
      image: '/images/highlight-side.svg'
    },
    {
      type: 'mcq',
      text: 'A red dot is glowing on one corner. Which vertex is it?',
      options: ['Vertex A', 'Vertex B', 'Vertex C', 'It is a side'],
      correct: 1,
      explanation: 'The red dot is on the bottom-left corner, which is labelled B.',
      image: '/images/highlight-vertex.svg'
    },
    {
      type: 'mcq',
      text: 'What part of the triangle is the orange slice at corner B?',
      options: ['A side', 'The area', 'A vertex', 'An angle'],
      correct: 3,
      explanation: 'The orange slice shows the opening between two sides at a vertex. That is an angle (∠B).',
      image: '/images/highlight-angle.svg'
    },
    {
      type: 'mcq',
      text: 'The whole inside of this triangle is coloured in dark blue. What is that called?',
      options: ['Vertex', 'Area', 'Side', 'Angle'],
      correct: 1,
      explanation: 'The space inside a closed shape is its area.',
      image: '/images/highlight-area.svg'
    },

    /* ---------- AREA AND ANGLES ---------- */
    {
      type: 'mcq',
      text: 'What does the area of a triangle tell us?',
      options: [
        'How many corners it has',
        'How far it is around the outside edge',
        'How much space is inside it',
        'How wide its angles are'
      ],
      correct: 2,
      explanation: 'Area is the amount of space inside the shape.'
    },
    {
      type: 'mcq',
      text: 'Which unit do we use to measure area?',
      options: ['cm', 'kg', '°', 'cm²'],
      correct: 3,
      explanation: 'Area is measured in square units, like cm² or m².'
    },
    {
      type: 'mcq',
      text: 'Angles are measured in...',
      options: ['Square centimetres (cm²)', 'Kilograms (kg)', 'Degrees (°)', 'Litres (ℓ)'],
      correct: 2,
      explanation: 'We measure angles in degrees, written with the ° symbol.'
    },

    /* ---------- CHALLENGE ---------- */
    {
      type: 'mcq',
      text: 'Final check: which sentence about a triangle is TRUE?',
      options: [
        'A triangle has 3 sides, 4 vertices and 3 angles',
        'A triangle has 4 sides, 3 vertices and 3 angles',
        'A triangle has 3 sides, 3 vertices and 1 angle',
        'A triangle has 3 sides, 3 vertices and 3 angles'
      ],
      correct: 3,
      explanation: 'Three sides, three vertices and three angles. You know your triangles!'
    },
  ];

  get isInfoQuestion(): boolean {
    return this.currentQuestion?.type === 'info';
  }

  get isMcq(): boolean {
    return this.currentQuestion?.type === 'mcq';
  }

  // the intro question is not scored, everything else is
  get scoredTotal(): number {
    return this.quizQuestions.filter(q => q.type !== 'info').length;
  }

  passMark = 70;

// exact percentage, used to decide pass or fail
private get rawPercent(): number {
  return this.scoredTotal ? (this.totalCorrect / this.scoredTotal) * 100 : 0;
}

// whole number shown to the learner (rounded down so 69.6% never shows as 70%)
get scorePercent(): number {
  return Math.floor(this.rawPercent);
}

get totalWrong(): number {
  return this.scoredTotal - this.totalCorrect;
}

get passed(): boolean {
  return this.rawPercent >= this.passMark;
}

get marksNeeded(): number {
  return Math.ceil((this.scoredTotal * this.passMark) / 100);
}

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
    this.stopTimer();
  }

  closeQuiz() {
    this.showQuiz = false;
    this.feedback = '';
    this.userAnswer = null;
    this.isCorrect = false;
    this.answered = false;
    this.quizCompleted = false;
    this.selectedOption = null;
  }

  loadQuestion() {
    this.currentQuestion = this.quizQuestions[this.currentQuestionIndex];
    this.userAnswer = null;
    this.feedback = '';
    this.isCorrect = false;
    this.answered = false;
    this.imageLoaded = false;
    this.selectedOption = null;
    this.startTimer();  }

  checkAnswer() {
    if (this.isInfoQuestion || this.isMcq) return;
    if (this.userAnswer === null || this.answered) return;
    this.answered = true;
    this.stopTimer()

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
      this.stopTimer();
      this.quizCompleted = true;
      this.showQuiz = false;
      this.showQuizCompletedPopup = true;
    }
  }

  retryQuiz() {
    this.showQuizCompletedPopup = false;
    this.openQuiz();
  }

  closeQuizCompletedPopup() {
    this.stopTimer();
    this.showQuizCompletedPopup = false;
    this.quizCompleted = false;
    this.totalCorrect = 0;
    this.currentQuestionIndex = 0;
  }

  downloadPDF() {
    const link = document.createElement('a');
    link.href = 'test.pdf';
    link.download = 'SesiMathebe-Extra Classes.pdf';
    link.click();
  }

  chooseOption(i: number) {
    if (this.answered || !this.isMcq) return;
    this.selectedOption = i;
    this.answered = true;
    this.stopTimer();

    if (i === this.currentQuestion.correct) {
      this.isCorrect = true;
      this.totalCorrect++;
      this.feedback = `✅ Correct! ${this.currentQuestion.explanation}`;
    } else {
      this.isCorrect = false;
      this.feedback = `❌ Not quite. ${this.currentQuestion.explanation}`;
    }
  }

  optionClass(i: number): string {
    if (!this.answered) {
      return 'border-slate-200 bg-white text-slate-800 hover:border-sky-400';
    }
    if (i === this.currentQuestion.correct) {
      return 'border-emerald-500 bg-emerald-50 text-emerald-800';
    }
    if (i === this.selectedOption) {
      return 'border-red-400 bg-red-50 text-red-700';
    }
    return 'border-slate-200 bg-white text-slate-400';
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
