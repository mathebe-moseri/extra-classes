import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth.service';
import { QuizProgressService } from '../../../quiz-progress.service';

type QuestionType = 'info' | 'mcq' | 'calc';

interface QuizQuestion {
  type: QuestionType;
  /** Question text, or the heading of a learn card (HTML allowed) */
  text: string;
  /** mcq: answer options */
  options?: string[];
  /** mcq: index of the correct option */
  correctIndex?: number;
  /** calc: the numeric answer. info: the definition / rules text shown in the card */
  answer?: number | string;
  /** Optional picture */
  image?: string;
  /** Shown when the answer is revealed */
  explanation?: string;
}

@Component({
  selector: 'app-number-patterns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [AuthService],
  templateUrl: './number-patterns.component.html',
  styleUrl: './number-patterns.component.css'
})
export class NumberPatternsComponent implements OnInit, OnDestroy {

  /** Admin switch: lets the learner use the "Check answer" link */
  @Input() answersEnabled = true;
  /** Percentage needed to pass */
  @Input() passMark = 70;
  /** Seconds allowed per scored question */
  @Input() timeTotal = 90;

  @Output() closed = new EventEmitter<void>();
  @Output() signUp = new EventEmitter<void>();

  title = 'Number patterns: Tn = a + (n − 1)d';

  // ---------- Questions ----------
  questions: QuizQuestion[] = [

    /* ================= LEARN 1: TERMS AND POSITIONS ================= */
    {
      type: 'info',
      text: 'What is a number pattern?',
      answer:
        'A number pattern (sequence) is a list of numbers that follows a rule. Each number is called a <strong>term</strong>.\n' +
        'T<sub>1</sub> = 1st term, T<sub>2</sub> = 2nd term, T<sub>3</sub> = 3rd term, and T<sub>n</sub> = the nth term.\n\n' +
        'Example: 5; 8; 11; 14; …\n' +
        'T<sub>1</sub> = 5, T<sub>2</sub> = 8, T<sub>3</sub> = 11, T<sub>4</sub> = 14'
    },
    {
      type: 'mcq',
      text: 'In the pattern <strong>7; 12; 17; 22; …</strong> what is T<sub>3</sub>?',
      options: ['12', '17', '22', '7'],
      correctIndex: 1,
      explanation: 'T<sub>3</sub> is the 3rd term, which is 17.'
    },
    {
      type: 'mcq',
      text: 'In a pattern, what does the symbol T<sub>n</sub> stand for?',
      options: ['The nth term', 'The number of terms', 'The common difference', 'The first term'],
      correctIndex: 0,
      explanation: 'T<sub>n</sub> is the term in position n. For example, T<sub>10</sub> is the 10th term.'
    },
    {
      type: 'calc',
      text: 'Write down the 5th term of the pattern <strong>3; 9; 15; 21; …</strong>',
      answer: 27,
      explanation: 'The pattern goes 3; 9; 15; 21; 27. So T<sub>5</sub> = 27.'
    },

    /* ================= LEARN 2: COMMON DIFFERENCE ================= */
    {
      type: 'info',
      text: 'The common difference (d)',
      answer:
        'The <strong>common difference</strong>, d, is the amount we add each time to get the next term.\n' +
        'd = T<sub>2</sub> − T<sub>1</sub> = T<sub>3</sub> − T<sub>2</sub> = …\n\n' +
        'Example 1: 4; 9; 14; 19; …\n' +
        'd = 9 − 4 = 5\n\n' +
        'Example 2 (going down): 20; 17; 14; 11; …\n' +
        'd = 17 − 20 = −3'
    },
    {
      type: 'mcq',
      text: 'What is the common difference of <strong>6; 10; 14; 18; …</strong>?',
      options: ['2', '4', '6', '10'],
      correctIndex: 1,
      explanation: 'd = 10 − 6 = 4.'
    },
    {
      type: 'mcq',
      text: 'What is the common difference of <strong>50; 45; 40; 35; …</strong>?',
      options: ['5', '−5', '10', '−10'],
      correctIndex: 1,
      explanation: 'd = 45 − 50 = −5. The pattern is going down, so d is negative.'
    },
    {
      type: 'mcq',
      text: 'Which of these patterns does NOT have a constant difference?',
      options: ['2; 4; 6; 8; …', '1; 2; 4; 8; …', '10; 7; 4; 1; …', '3; 3; 3; 3; …'],
      correctIndex: 1,
      explanation: '1; 2; 4; 8 goes up by 1, then 2, then 4. The jumps are not the same, so there is no constant difference.'
    },
    {
      type: 'calc',
      text: 'Find the common difference of <strong>2.5; 4; 5.5; 7; …</strong>',
      answer: 1.5,
      explanation: 'd = 4 − 2.5 = 1.5.'
    },
    {
      type: 'calc',
      text: 'Sipho saves R50 in week 1, R80 in week 2 and R110 in week 3. What is the common difference (in rand)?',
      answer: 30,
      explanation: 'd = 80 − 50 = R30. He saves R30 more each week.'
    },

    /* ================= LEARN 3: THE FORMULA ================= */
    {
      type: 'info',
      text: 'The formula: T<sub>n</sub> = a + (n − 1)d',
      answer:
        'This formula finds <strong>any</strong> term without writing out the whole pattern.\n\n' +
        'T<sub>n</sub> = the term you want\n' +
        'a = the first term (T<sub>1</sub>)\n' +
        'n = the position of the term\n' +
        'd = the common difference\n\n' +
        'Example: 3; 7; 11; 15; …  Find T<sub>10</sub>.\n' +
        'a = 3 and d = 4\n' +
        'T<sub>10</sub> = 3 + (10 − 1)(4)\n' +
        'T<sub>10</sub> = 3 + 36\n' +
        'T<sub>10</sub> = 39'
    },
    {
      type: 'mcq',
      text: 'For the pattern <strong>2; 5; 8; 11; …</strong> which values of a and d must we use?',
      options: ['a = 2 and d = 3', 'a = 3 and d = 2', 'a = 2 and d = 5', 'a = 11 and d = 3'],
      correctIndex: 0,
      explanation: 'a is the first term (2) and d = 5 − 2 = 3.'
    },
    {
      type: 'mcq',
      text: 'Which substitution gives T<sub>20</sub> of <strong>6; 10; 14; …</strong>?',
      options: [
        '6 + (20 − 1)(4)',
        '6 + 20(4)',
        '4 + (20 − 1)(6)',
        '6 + (20 + 1)(4)'
      ],
      correctIndex: 0,
      explanation: 'a = 6, d = 4 and n = 20, so T<sub>20</sub> = 6 + (20 − 1)(4) = 82.'
    },
    {
      type: 'calc',
      text: 'Find T<sub>8</sub> of the pattern <strong>5; 9; 13; …</strong>',
      answer: 33,
      explanation: 'a = 5, d = 4. T<sub>8</sub> = 5 + (8 − 1)(4) = 5 + 28 = 33.'
    },
    {
      type: 'calc',
      text: 'Find T<sub>12</sub> of the pattern <strong>2; 5; 8; …</strong>',
      answer: 35,
      explanation: 'a = 2, d = 3. T<sub>12</sub> = 2 + (12 − 1)(3) = 2 + 33 = 35.'
    },
    {
      type: 'calc',
      text: 'A taxi charges R15 for 1 km, R18 for 2 km, R21 for 3 km and so on. How much does a 20 km trip cost (in rand)?',
      answer: 72,
      explanation: 'a = 15, d = 3. T<sub>20</sub> = 15 + (20 − 1)(3) = 15 + 57 = R72.'
    },
    {
      type: 'calc',
      text: 'Find T<sub>15</sub> of the pattern <strong>100; 93; 86; …</strong>',
      answer: 2,
      explanation: 'a = 100, d = −7. T<sub>15</sub> = 100 + (15 − 1)(−7) = 100 − 98 = 2.'
    },

    /* ================= LEARN 4: THE GENERAL TERM ================= */
    {
      type: 'info',
      text: 'Writing the rule for any term',
      answer:
        'Put a and d into the formula, then simplify. You get a short rule for T<sub>n</sub>.\n\n' +
        'Example: 5; 8; 11; …\n' +
        'a = 5 and d = 3\n' +
        'T<sub>n</sub> = 5 + (n − 1)(3)\n' +
        'T<sub>n</sub> = 5 + 3n − 3\n' +
        'T<sub>n</sub> = 3n + 2\n\n' +
        'Check: T<sub>4</sub> = 3(4) + 2 = 14 ✓'
    },
    {
      type: 'mcq',
      text: 'What is the general term T<sub>n</sub> of <strong>4; 7; 10; …</strong>?',
      options: ['3n + 1', '3n + 4', '4n + 3', '3n − 1'],
      correctIndex: 0,
      explanation: 'a = 4, d = 3. T<sub>n</sub> = 4 + (n − 1)(3) = 4 + 3n − 3 = 3n + 1.'
    },
    {
      type: 'mcq',
      text: 'What is the general term T<sub>n</sub> of <strong>10; 8; 6; …</strong>?',
      options: ['2n + 8', '−2n + 12', '−2n + 10', '12n − 2'],
      correctIndex: 1,
      explanation: 'a = 10, d = −2. T<sub>n</sub> = 10 + (n − 1)(−2) = 10 − 2n + 2 = −2n + 12.'
    },
    {
      type: 'mcq',
      text: 'A pattern has the rule T<sub>n</sub> = 2n + 5. What is the first term?',
      options: ['2', '5', '7', '9'],
      correctIndex: 2,
      explanation: 'T<sub>1</sub> = 2(1) + 5 = 7.'
    },
    {
      type: 'calc',
      text: 'A pattern has the rule T<sub>n</sub> = 4n − 3. Find T<sub>10</sub>.',
      answer: 37,
      explanation: 'T<sub>10</sub> = 4(10) − 3 = 40 − 3 = 37.'
    },
    {
      type: 'calc',
      text: 'A pattern has the rule T<sub>n</sub> = 5n − 2. Find T<sub>20</sub>.',
      answer: 98,
      explanation: 'T<sub>20</sub> = 5(20) − 2 = 100 − 2 = 98.'
    },

    /* ================= LEARN 5: FINDING n ================= */
    {
      type: 'info',
      text: 'Which term is it? (finding n)',
      answer:
        'To find the position of a term, put T<sub>n</sub> equal to that number and solve for n.\n\n' +
        'Example: 4; 7; 10; …  Which term is 52?\n' +
        'a = 4 and d = 3\n' +
        '4 + (n − 1)(3) = 52\n' +
        '(n − 1)(3) = 48\n' +
        'n − 1 = 16\n' +
        'n = 17\n' +
        'So 52 is the 17th term.\n\n' +
        'Tip: n must be a whole number. If it is not, the number is NOT in the pattern.'
    },
    {
      type: 'mcq',
      text: 'Is 100 a term of the pattern <strong>3; 7; 11; …</strong>?',
      options: [
        'Yes, it is the 25th term',
        'Yes, it is the 26th term',
        'No, because n is not a whole number',
        'No, because 100 is too big'
      ],
      correctIndex: 2,
      explanation: '3 + (n − 1)(4) = 100 gives n − 1 = 24.25, so n = 25.25. It is not a whole number, so 100 is not in the pattern.'
    },
    {
      type: 'calc',
      text: 'Which term of <strong>2; 5; 8; …</strong> is equal to 47? (give the value of n)',
      answer: 16,
      explanation: '2 + (n − 1)(3) = 47, so (n − 1)(3) = 45, n − 1 = 15 and n = 16.'
    },
    {
      type: 'calc',
      text: 'How many terms are in the pattern <strong>6; 10; 14; …; 86</strong>?',
      answer: 21,
      explanation: '6 + (n − 1)(4) = 86, so (n − 1)(4) = 80, n − 1 = 20 and n = 21.'
    },
    {
      type: 'calc',
      text: 'Tshepo reads 12 pages on day 1, 20 pages on day 2 and 28 pages on day 3. On which day will he read 108 pages?',
      answer: 13,
      explanation: 'a = 12, d = 8. 12 + (n − 1)(8) = 108, so n − 1 = 12 and n = 13. It is day 13.'
    },
    {
      type: 'calc',
      text: 'Which term of <strong>90; 85; 80; …</strong> is equal to 0?',
      answer: 19,
      explanation: 'd = −5. 90 + (n − 1)(−5) = 0, so (n − 1)(−5) = −90, n − 1 = 18 and n = 19.'
    },

    /* ================= LEARN 6: FINDING a AND d FROM TWO TERMS ================= */
    {
      type: 'info',
      text: 'Finding a and d from two terms',
      answer:
        'If you are given two terms, you can work out d and then a.\n\n' +
        'Example: T<sub>3</sub> = 11 and T<sub>7</sub> = 27\n\n' +
        'Step 1: Find d.\n' +
        'From T<sub>3</sub> to T<sub>7</sub> there are 4 jumps of d.\n' +
        '27 − 11 = 4d, so d = 4\n\n' +
        'Step 2: Find a.\n' +
        'T<sub>3</sub> = a + 2d\n' +
        '11 = a + 8, so a = 3\n\n' +
        'The pattern is 3; 7; 11; 15; …'
    },
    {
      type: 'mcq',
      text: 'You are given T<sub>3</sub> = 11 and T<sub>7</sub> = 27. How many jumps of d are there from T<sub>3</sub> to T<sub>7</sub>?',
      options: ['3', '4', '5', '7'],
      correctIndex: 1,
      explanation: '7 − 3 = 4 jumps.'
    },
    {
      type: 'calc',
      text: 'In a pattern, T<sub>2</sub> = 9 and T<sub>5</sub> = 18. Find d.',
      answer: 3,
      explanation: 'There are 5 − 2 = 3 jumps. 18 − 9 = 3d, so d = 3.'
    },
    {
      type: 'calc',
      text: 'In the same pattern (T<sub>2</sub> = 9 and d = 3), find the first term a.',
      answer: 6,
      explanation: 'T<sub>2</sub> = a + d, so 9 = a + 3 and a = 6.'
    },
    {
      type: 'calc',
      text: 'In a pattern, T<sub>4</sub> = 20 and T<sub>8</sub> = 44. Find d.',
      answer: 6,
      explanation: '44 − 20 = 4d, so 24 = 4d and d = 6.'
    },
    {
      type: 'calc',
      text: 'In the same pattern (T<sub>4</sub> = 20 and d = 6), find the first term a.',
      answer: 2,
      explanation: 'T<sub>4</sub> = a + 3d, so 20 = a + 18 and a = 2.'
    },
    {
      type: 'calc',
      text: 'A tank fills at a constant rate. After 2 minutes it holds 30 ℓ and after 6 minutes it holds 70 ℓ. How many litres does it hold after 10 minutes?',
      answer: 110,
      explanation: '70 − 30 = 4d, so d = 10 and a = 30 − 10 = 20. T<sub>10</sub> = 20 + (10 − 1)(10) = 110 ℓ.'
    },

    /* ================= CHALLENGE ================= */
    {
      type: 'mcq',
      text: 'Which statement about T<sub>n</sub> = a + (n − 1)d is TRUE?',
      options: [
        'It only works when the pattern goes up',
        'It works for patterns that go up (d positive) and down (d negative)',
        'It works for every pattern, even without a constant difference',
        'n is always the first term'
      ],
      correctIndex: 1,
      explanation: 'The formula works whenever there is a constant difference, whether d is positive or negative.'
    },
    {
      type: 'calc',
      text: 'A hall has 14 chairs in row 1 and every row has 2 more chairs than the row before. How many chairs are in row 12?',
      answer: 36,
      explanation: 'a = 14, d = 2. T<sub>12</sub> = 14 + (12 − 1)(2) = 14 + 22 = 36 chairs.'
    },
    {
      type: 'calc',
      text: 'A runner runs 2 km on day 1 and adds 0.5 km each day. On which day will she run 6 km?',
      answer: 9,
      explanation: 'a = 2, d = 0.5. 2 + (n − 1)(0.5) = 6, so (n − 1)(0.5) = 4, n − 1 = 8 and n = 9.'
    }
  ];

  // ---------- State ----------
  currentIndex = 0;
  showResults = false;

  answered = false;
  revealed = false;
  isCorrect = false;
  selectedOption: number | null = null;
  userAnswer: number | null = null;
  feedback = '';

  timeLeft = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;

  totalCorrect = 0;
  totalWrong = 0;

  constructor(private auth: AuthService, private progress: QuizProgressService) { }

  // ---------- Lifecycle ----------
  ngOnInit(): void {
    this.startQuestion();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ---------- Getters used by the template ----------
  get currentQuestion(): QuizQuestion {
    return this.questions[this.currentIndex];
  }

  get isInfo(): boolean {
    return this.currentQuestion?.type === 'info';
  }

  get isMcq(): boolean {
    return this.currentQuestion?.type === 'mcq';
  }

  /** Number of questions that count towards the score (learn cards excluded) */
  get scoredTotal(): number {
    return this.questions.filter(q => q.type !== 'info').length;
  }

  /** Scored questions completed or in progress up to the current card */
  get questionNumber(): number {
    const scoredBefore = this.questions
      .slice(0, this.currentIndex + 1)
      .filter(q => q.type !== 'info').length;
    return scoredBefore;
  }

  get isLast(): boolean {
    return this.currentIndex === this.questions.length - 1;
  }

  get nextLabel(): string {
    if (this.isInfo) {
      return 'Start';
    }
    return this.isLast ? 'See results' : 'Next';
  }

  get scorePercent(): number {
    return this.scoredTotal ? Math.round((this.totalCorrect / this.scoredTotal) * 100) : 0;
  }

  get passed(): boolean {
    return this.scorePercent >= this.passMark;
  }

  /** Total correct answers required to reach the pass mark */
  get marksNeeded(): number {
    return Math.ceil((this.passMark / 100) * this.scoredTotal);
  }

  // ---------- Question flow ----------
  private startQuestion(): void {
    this.answered = false;
    this.revealed = false;
    this.isCorrect = false;
    this.selectedOption = null;
    this.userAnswer = null;
    this.feedback = '';
    this.stopTimer();

    if (!this.isInfo) {
      this.startTimer();
    }
  }

  chooseOption(index: number): void {
    if (this.answered) {
      return;
    }
    this.selectedOption = index;
    this.isCorrect = index === this.currentQuestion.correctIndex;
    this.lockAnswer();
  }

  checkAnswer(): void {
    if (this.answered || this.userAnswer === null || this.userAnswer === undefined) {
      return;
    }
    const expected = Number(this.currentQuestion.answer);
    this.isCorrect = Math.abs(Number(this.userAnswer) - expected) < 0.0001;
    this.lockAnswer();
  }

  /** Reveal whether the locked-in answer was right (admin-enabled) */
  revealAnswer(): void {
    if (!this.answered || this.revealed || !this.answersEnabled) {
      return;
    }
    this.revealed = true;

    const explanation = this.currentQuestion.explanation ?? '';
    if (this.isCorrect) {
      this.feedback = `Correct! ${explanation}`;
    } else if (this.isMcq) {
      const right = this.currentQuestion.options?.[this.currentQuestion.correctIndex ?? 0];
      this.feedback = `Not quite. The correct answer is <strong>${right}</strong>. ${explanation}`;
    } else {
      this.feedback = `Not quite. The correct answer is <strong>${this.currentQuestion.answer}</strong>. ${explanation}`;
    }
  }

  private lockAnswer(): void {
    this.answered = true;
    this.stopTimer();
    if (this.isCorrect) {
      this.totalCorrect++;
    } else {
      this.totalWrong++;
    }
      this.saveProgress(this.isCorrect);
    this.feedback = 'Answer saved.';
  }

  nextQuestion(): void {
    this.stopTimer();

    if (this.isLast) {
      this.showResults = true;
      return;
    }
    this.currentIndex++;
    this.startQuestion();
  }

  private saveProgress(ok: boolean): void {
    if (!this.auth.isLoggedIn()) {
      return;
    }
    const total = this.scoredTotal;
    this.progress.record('patterns', `q${this.currentIndex}`, 'Number patterns', ok, total, { 'Number patterns': total });
  }

  // ---------- Option styling ----------
  optionClass(i: number): string {
    const correctIdx = this.currentQuestion.correctIndex;

    if (!this.answered) {
      return 'border-slate-200 bg-white text-slate-800 hover:border-sky-400 hover:bg-sky-50';
    }

    if (!this.revealed) {
      return i === this.selectedOption
        ? 'border-sky-500 bg-sky-50 text-slate-900'
        : 'border-slate-200 bg-white text-slate-400';
    }

    if (i === this.selectedOption) {
      return this.isCorrect
        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
        : 'border-red-500 bg-red-50 text-red-800';
    }
    if (i === correctIdx) {
      return 'border-emerald-400 bg-emerald-50 text-emerald-800';
    }
    return 'border-slate-200 bg-white text-slate-400';
  }

  // ---------- Timer ----------
  private startTimer(): void {
    this.timeLeft = this.timeTotal;
    this.timerId = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.timeUp();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private timeUp(): void {
    this.stopTimer();
    this.timeLeft = 0;
    if (this.answered) {
      return;
    }
    this.isCorrect = false;
    this.selectedOption = null;
    this.answered = true;
    this.totalWrong++;
    this.saveProgress(false);
    this.feedback = "Time's up!";
  }

  // ---------- Results actions ----------
  retry(): void {
    this.stopTimer();
    this.currentIndex = 0;
    this.totalCorrect = 0;
    this.totalWrong = 0;
    this.showResults = false;
    this.startQuestion();
  }

  goSignUp(): void {
    this.stopTimer();
    this.signUp.emit();
  }

  close(): void {
    this.stopTimer();
    this.closed.emit();
  }
}
