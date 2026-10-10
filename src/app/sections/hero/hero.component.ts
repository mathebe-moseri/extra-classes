import { Component, AfterViewInit, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JoinFormService } from '../../join-form.service';
import { RevealDirective } from '../../shared/reveal.directive';
import { smoothScrollToId } from '../../shared/smooth-scroll';

// Stacked fraction: frac('O', 'H') shows O over H with a fraction bar
const frac = (top: string, bottom: string) =>
  `<span class="frac"><span>${top}</span><span>${bottom}</span></span>`;

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule, RevealDirective],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {

  /* ---------------- VIDEO CONTROL ---------------- */
  @ViewChild('applyVideo') applyVideo?: ElementRef<HTMLVideoElement>;
  private videoObserver?: IntersectionObserver;

  // Only one video may play at a time: when one starts, pause all the others
  private onAnyPlay = (e: Event) => {
    const playing = e.target;
    if (!(playing instanceof HTMLVideoElement)) return;
    document.querySelectorAll('video').forEach(v => {
      if (v !== playing && !v.paused) v.pause();
    });
  };

  private pauseAllVideos() {
    document.querySelectorAll('video').forEach(v => {
      if (!v.paused) v.pause();
    });
  }

  /* ---------------- QUIZ STATE ---------------- */
  showQuiz = false;
  showQuizCompletedPopup = false;
  showPartBreak = false;       // true while the "Part complete" card is showing
  userAnswer: number | null = null;
  feedback = '';
  isCorrect = false;
  answered = false;            // true once the learner has checked an answer
  answersEnabled = false;      // admin switch: false = answers stay hidden and Check answer is disabled
  revealed = false;            // true once the learner has used Check answer on this question
  imageLoaded = false;
  quizCompleted = false;
  totalCorrect = 0;
  correctByPart: number[] = [0, 0];   // correct answers per part
  selectedOption: number | null = null;

  /* ---------------- SAVED PROGRESS ---------------- */
  // v2: the question list changed, so old saved positions are ignored
  private readonly PROGRESS_KEY = 'trig-quiz-progress-v2';
  showResumePrompt = false;
  savedProgress: { index: number; totalCorrect: number; correctByPart: number[] } | null = null;

  get savedQuestionNumber(): number {
    return Math.min((this.savedProgress?.index ?? 0) + 1, this.quizQuestions.length);
  }

  get savedPartName(): string {
    const q = this.quizQuestions[this.savedProgress?.index ?? 0];
    return q ? this.parts[q.part] : '';
  }

  private saveProgress(index: number) {
    if (index <= 0) { this.clearProgress(); return; }
    try {
      localStorage.setItem(this.PROGRESS_KEY, JSON.stringify({
        index,
        totalCorrect: this.totalCorrect,
        correctByPart: this.correctByPart
      }));
    } catch { /* storage blocked: quiz still works, just can't resume */ }
  }

  private readProgress() {
    try {
      const raw = localStorage.getItem(this.PROGRESS_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      const valid =
        Number.isInteger(p.index) && p.index > 0 && p.index <= this.quizQuestions.length &&
        Number.isFinite(p.totalCorrect) &&
        Array.isArray(p.correctByPart) && p.correctByPart.length === this.parts.length;
      return valid ? p : null;
    } catch { return null; }
  }

  private clearProgress() {
    try { localStorage.removeItem(this.PROGRESS_KEY); } catch { }
  }

  currentQuestionIndex = 0;
  currentQuestion: any;
  completedMessage = '';

  timeLeft = 0;
  timeTotal = 0;
  private timerId: any = null;

  ngOnDestroy() {
    this.stopTimer();
    this.videoObserver?.disconnect();
    document.removeEventListener('play', this.onAnyPlay, true);
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
    this.feedback = "⏰ Time's up! This question is marked wrong. Tap Next to carry on.";
    this.saveProgress(this.currentQuestionIndex + 1);
  }

  copied = false;              // shows "Copied" on the account number button

  constructor(private joinForm: JoinFormService) { }

  ngOnInit() {
    // Hamburger menu "Testimonials" -> open the testimonials popup
    this.joinForm.testimonialsRequested$.subscribe(() => this.openTestimonials());
  }

  // Set to true when the database is back and registrations reopen
  registrationsOpen = false;
  showClosedNotice = false;

  openJoin() {
    if (!this.registrationsOpen) {
      this.showClosedNotice = true;   // registrations closed: show the popup
      return;
    }
    this.joinForm.open();
  }

  closeClosedNotice() {
    this.showClosedNotice = false;
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

  scrollToAbout() {
    smoothScrollToId('about-us');
  }

  async copyAccount() {
    try {
      await navigator.clipboard.writeText('9388305991');
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    } catch {
      /* clipboard blocked: the number is still on screen to copy by hand */
    }
  }

  // Escape closes whichever popup is open
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showClosedNotice) this.closeClosedNotice();
    else if (this.showResumePrompt) this.closeResumePrompt();
    else if (this.showQuizCompletedPopup) this.closeQuizCompletedPopup();
    else if (this.showTestimonials) this.closeTestimonials();
  }

  /* ---------------- QUIZ CONTENT ---------------- */

  // The parts of "Introduction to Trigonometry"
  parts: string[] = ['The parts of a triangle', 'Rules of a triangle'];

  /* ===== PART 1: THE PARTS OF A TRIANGLE ===== */
  private partOneQuestions: any[] = [
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
      text: 'Which sentence about a triangle is TRUE?',
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

  /* ===== PART 2: RULES OF A TRIANGLE ===== */
  private partTwoQuestions: any[] = [
    /* ---------- LEARN: the rules (12 rule pages) ---------- */
    {
      type: 'info',
      // text: 'Part 2: The rules of a triangle',
      rules: [
        {
          title: 'Angles',
          text: 'Interior angles of a triangle always adds up to 180°.',
          image: '/images/rule-angles.svg',
          fun: '',
          extra: {
            title: 'Straight line',
            text: 'Angles that sit together on a straight line adds up to 180°.',
            image: '/images/rule-angles-line.svg',
            fun: ''
          }
        },
        {
          title: 'Exterior angle',
          text: 'An exterior (outside) angle equals the two inside angles it is NOT next to.',
          image: '/images/rule-exterior.svg',
          fun: '',
          extra: {
            title: 'Exterior angles',
            text: 'The three exterior angles, one at each corner, adds up to 360°.',
            image: '/images/rule-exterior-sum.svg',
            fun: ''
          }
        },
        {
          title: 'Sides',
          text: 'Any two sides added together are longer than the third side.',
          image: '/images/rule-sides.svg',
          fun: ''
        },
        {
          title: 'Longest side',
          text: 'The longest side is opposite the largest angle.',
          image: '/images/rule-longest.svg',
          fun: ''
        },
        {
          title: 'Equal sides',
          text: 'Two equal sides mean two equal angles. This is called an isosceles triangle.',
          image: '/images/rule-isosceles.svg',
          fun: '',
          extra: {
            title: 'Equilateral',
            text: 'Three equal sides mean three equal angles, 60° each.',
            image: '/images/rule-equilateral.svg',
            fun: ''
          }
        },
        {
          title: 'Types of triangle',
          text: 'Name a triangle by its sides: equilateral, isosceles or scalene.',
          image: '/images/rule-types-sides.svg',
          fun: '',
          extra: {
            title: 'Types by angle',
            text: 'Name a triangle by its angles: acute, right or obtuse.',
            image: '/images/rule-types-angles.svg',
            fun: ''
          }
        },
        {
          title: 'Pythagoras',
          text: 'In a right-angled triangle: a² + b² = c², where c is the longest side.',
          image: '/images/rule-pythagoras.svg',
          fun: ''
        },
        {
          title: 'Midsegment',
          text: 'A line joining the midpoints of two sides is parallel to the third side and half as long.',
          image: '/images/rule-midsegment.svg',
          fun: ''
        },
        {
          title: 'Medians',
          text: 'The three medians meet at one point, the centroid. It splits each median in the ratio 2 : 1.',
          image: '/images/rule-centroid.svg',
          fun: ''
        },
        {
          title: 'Perimeter',
          text: 'Perimeter = a + b + c (the distance around the outside).',
          image: '/images/rule-perimeter.svg',
          fun: ''
        },
        {
          title: 'Area',
          text: 'Area = ½ × base × height.',
          image: '/images/rule-area.svg',
          fun: ''
        },
        {
          title: 'SOH CAH TOA',
          text: `In a right-angled triangle: sin θ = ${frac('O', 'H')}, cos θ = ${frac('A', 'H')}, tan θ = ${frac('O', 'A')}.`,
          image: '/images/rule-soh-cah-toa.svg',
          fun: ''
        }
      ]
    },

    /* ---------- ANGLE RULES ---------- */
    {
      type: 'mcq',
      text: 'The three angles inside any triangle always add up to...',
      options: ['90°', '180°', '270°', '360°'],
      correct: 1,
      explanation: 'The interior angles of every triangle add up to 180°.'
    },
    {
      type: 'calc',
      time: 60,
      text: 'Two angles of a triangle are 50° and 60°. What is the third angle? (in degrees)',
      image: '/images/p2-third-angle.svg',
      answer: 70
    },
    {
      type: 'mcq',
      text: 'A learner says a triangle has angles of 80°, 60° and 50°. Is this possible?',
      options: [
        'Yes, any three angles make a triangle',
        'Yes, because all the angles are less than 90°',
        'No, they add up to 190° and not 180°',
        'No, a triangle can only have one angle of 80°'
      ],
      correct: 2,
      explanation: '80° + 60° + 50° = 190°. The angles of a triangle must add up to exactly 180°.'
    },

    /* ---------- EXTERIOR ANGLES ---------- */
    {
      type: 'mcq',
      text: 'An exterior angle of a triangle is equal to...',
      options: [
        'The sum of the two interior angles it is not next to',
        'The interior angle next to it',
        '180° minus the longest side',
        'The sum of all three interior angles'
      ],
      correct: 0,
      explanation: 'An exterior angle equals the sum of the two opposite (non-adjacent) interior angles.'
    },
    {
      type: 'calc',
      time: 60,
      text: 'Two inside angles of a triangle are 40° and 65°. What is the exterior angle at the third corner? (in degrees)',
      image: '/images/p2-exterior-calc.svg',
      answer: 105
    },
    {
      type: 'calc',
      time: 60,
      text: 'An exterior angle is 130°. One of the two far inside angles is 80°. What is the other one? (in degrees)',
      image: '/images/p2-exterior-find.svg',
      answer: 50
    },
    {
      type: 'mcq',
      text: 'If you take one exterior angle at each vertex, they add up to...',
      options: ['180°', '270°', '360°', '540°'],
      correct: 2,
      explanation: 'The exterior angles of a triangle (one at each vertex) always add up to 360°.'
    },

    /* ---------- SIDE RULES ---------- */
    {
      type: 'mcq',
      text: 'Which set of side lengths can form a triangle?',
      options: ['1 cm, 2 cm, 3 cm', '2 cm, 2 cm, 5 cm', '3 cm, 4 cm, 5 cm', '2 cm, 3 cm, 6 cm'],
      correct: 2,
      explanation: 'Two shorter sides must add up to MORE than the longest side. 3 + 4 = 7, which is more than 5.'
    },
    {
      type: 'mcq',
      text: 'Two sides of a triangle are 4 cm and 6 cm. The third side must be...',
      options: [
        'Exactly 10 cm',
        'Between 2 cm and 10 cm',
        'Less than 2 cm',
        'More than 10 cm'
      ],
      correct: 1,
      explanation: 'The third side must be shorter than 4 + 6 = 10 and longer than 6 − 4 = 2.'
    },
    {
      type: 'mcq',
      text: 'In a triangle, the longest side is always opposite the...',
      options: ['Smallest angle', 'Largest angle', 'Smallest side', 'Vertex at the top'],
      correct: 1,
      explanation: 'The longest side is opposite the largest angle.'
    },
    {
      type: 'mcq',
      text: 'In triangle ABC, angle B is the smallest angle. Which side is the shortest?',
      image: '/images/p2-smallest-angle.svg',
      options: ['Side AB', 'Side AC', 'Side BC', 'We cannot tell'],
      correct: 1,
      explanation: 'The shortest side is opposite the smallest angle. The side opposite B is AC.'
    },

    /* ---------- EQUAL SIDES, EQUAL ANGLES ---------- */
    {
      type: 'calc',
      time: 60,
      text: 'An isosceles triangle has a top angle of 40°. What is each base angle? (in degrees)',
      image: '/images/p2-isosceles-top.svg',
      answer: 70
    },
    {
      type: 'mcq',
      text: 'A triangle has two angles of 50° each. What must be true?',
      options: [
        'It has two equal sides (it is isosceles)',
        'It has three equal sides',
        'All three sides are different',
        'It must have a right angle'
      ],
      correct: 0,
      explanation: 'Equal angles mean equal opposite sides. The third angle is 80°, so it is isosceles but not equilateral.'
    },
    {
      type: 'mcq',
      text: 'Each angle of an equilateral triangle is...',
      options: ['30°', '45°', '60°', '90°'],
      correct: 2,
      explanation: `Three equal angles that add up to 180° gives ${frac('180°', '3')} = 60° each.`
    },

    /* ---------- TYPES OF TRIANGLE ---------- */
    {
      type: 'mcq',
      text: 'A triangle has sides of 5 cm, 5 cm and 8 cm. What type is it?',
      image: '/images/p2-sides-5-5-8.svg',
      options: ['Equilateral', 'Isosceles', 'Scalene', 'Right-angled'],
      correct: 1,
      explanation: 'Exactly two sides are equal, so it is isosceles.'
    },
    {
      type: 'mcq',
      text: 'A triangle has angles of 30°, 40° and 110°. What type is it?',
      image: '/images/p2-angles-30-40-110.svg',
      options: ['Acute', 'Right-angled', 'Obtuse', 'Equilateral'],
      correct: 2,
      explanation: '110° is bigger than 90°, so the triangle is obtuse.'
    },
    {
      type: 'mcq',
      text: 'One angle of a triangle is 90°. What do the other two angles add up to?',
      image: '/images/p2-right-angle-others.svg',
      options: ['45°', '90°', '120°', '180°'],
      correct: 1,
      explanation: '180° − 90° = 90°. The other two angles share the remaining 90°.'
    },

    /* ---------- PYTHAGORAS ---------- */
    {
      type: 'mcq',
      text: "Pythagoras' rule a² + b² = c² only works for...",
      options: ['Every triangle', 'Right-angled triangles', 'Equilateral triangles', 'Obtuse triangles'],
      correct: 1,
      explanation: 'It only works when the triangle has a 90° angle. c is the side opposite that angle.'
    },
    {
      type: 'calc',
      time: 60,
      text: 'A right-angled triangle has short sides of 6 cm and 8 cm. How long is the longest side? (in cm)',
      image: '/images/p2-pythagoras-6-8.svg',
      answer: 10
    },
    {
      type: 'mcq',
      text: 'Which set of sides makes a right-angled triangle?',
      options: ['5, 12, 14', '6, 8, 10', '4, 5, 7', '2, 3, 4'],
      correct: 1,
      explanation: '6² + 8² = 36 + 64 = 100 = 10². The others do not fit a² + b² = c².'
    },

    /* ---------- PERIMETER AND AREA ---------- */
    {
      type: 'calc',
      time: 60,
      text: 'A triangle has sides of 5 cm, 7 cm and 9 cm. What is its perimeter? (in cm)',
      image: '/images/p2-perimeter-5-7-9.svg',
      answer: 21
    },
    {
      type: 'mcq',
      text: 'Which unit do we use for the perimeter of a triangle?',
      options: ['cm²', 'cm', '°', 'kg'],
      correct: 1,
      explanation: 'Perimeter is a length, so it is measured in cm, m or km. Area uses square units.'
    },
    {
      type: 'mcq',
      text: 'Which formula gives the area of a triangle?',
      options: ['a + b + c', 'base × height', '½ × base × height', '180° − base'],
      correct: 2,
      explanation: 'Area of a triangle = ½ × base × height.'
    },
    {
      type: 'calc',
      time: 60,
      text: 'A triangle has a base of 10 cm and a height of 6 cm. What is its area? (in cm²)',
      image: '/images/p2-area-10-6.svg',
      answer: 30
    },

    /* ---------- LINES INSIDE A TRIANGLE ---------- */
    {
      type: 'mcq',
      text: 'A line joins the midpoints of two sides of a triangle. What do we know about it?',
      image: '/images/p2-midsegment.svg',
      options: [
        'It is parallel to the third side and half its length',
        'It is parallel to the third side and the same length',
        'It is perpendicular to the third side',
        'It is always longer than the third side'
      ],
      correct: 0,
      explanation: 'The midsegment theorem: the line is parallel to the third side and half its length.'
    },
    {
      type: 'calc',
      time: 60,
      text: 'The bottom side of a triangle is 18 cm. How long is the midsegment that is parallel to it? (in cm)',
      image: '/images/p2-midsegment-18.svg',
      answer: 9
    },
    {
      type: 'mcq',
      text: 'The three medians of a triangle meet at the centroid. It splits each median in the ratio...',
      image: '/images/p2-centroid.svg',
      options: ['1 : 1', '2 : 1', '3 : 1', '3 : 2'],
      correct: 1,
      explanation: 'The centroid is twice as far from the corner as it is from the middle of the opposite side.'
    },
    {
      type: 'calc',
      time: 60,
      text: 'A median is 21 cm long. How far is the centroid from the corner? (in cm)',
      image: '/images/p2-median-21.svg',
      answer: 14
    },

    /* ---------- SOH CAH TOA ---------- */
    {
      type: 'mcq',
      text: 'In a right-angled triangle, sin θ is equal to...',
      image: '/images/p2-soh-cah-toa-sides.svg',

      options: [
        frac('Opposite', 'Hypotenuse'),
        frac('Adjacent', 'Hypotenuse'),
        frac('Opposite', 'Adjacent'),
        frac('Hypotenuse', 'Opposite')
      ],
      correct: 0,
      xplanation: `SOH: Sine = ${frac('Opposite', 'Hypotenuse')}.`
    },
    {
      type: 'mcq',
      text: `Which letters of SOH CAH TOA give tan θ = ${frac('Opposite', 'Adjacent')}?`,
      options: ['SOH', 'CAH', 'TOA', 'None of them'],
      correct: 2,
      explanation: `TOA: Tangent = ${frac('Opposite', 'Adjacent')}.`
    },
    {
      type: 'calc',
      time: 60,
      text: 'In a right-angled triangle the opposite side is 3 and the hypotenuse is 5. What is sin θ? (as a decimal)',
      image: '/images/p2-sin-3-5.svg',
      answer: 0.6
    },

    /* ---------- CHALLENGE ---------- */
    {
      type: 'mcq',
      text: 'Which statement is TRUE for every triangle?',
      options: [
        'The angles add up to 360°',
        'Two sides added together are longer than the third side',
        'All three sides are the same length',
        'The area is base × height'
      ],
      correct: 1,
      explanation: 'The sum of any two sides is always greater than the third side. You know your rules!'
    },
  ];

  // All questions in order, each tagged with its part (0 = Part 1, 1 = Part 2)
  quizQuestions: any[] = [
    ...this.partOneQuestions.map(q => ({ ...q, part: 0 })),
    ...this.partTwoQuestions.map(q => ({ ...q, part: 1 })),
  ];

  get isInfoQuestion(): boolean {
    return this.currentQuestion?.type === 'info';
  }

  get isMcq(): boolean {
    return this.currentQuestion?.type === 'mcq';
  }

  /* ---------------- RULE PAGES (Part 2 intro) ---------------- */
  ruleIndex = 0;       // which rule page is showing (0 = first)
  showExtra = false;   // true while the second info page of a rule is showing

  get shownImage(): string {
    return this.showExtra ? this.currentRule?.extra?.image : this.currentRule?.image;
  }

  get shownText(): string {
    return this.showExtra ? this.currentRule?.extra?.text : this.currentRule?.text;
  }

  // NEW: title shown in the blue header of the rule card
  get shownTitle(): string {
    return (this.showExtra ? this.currentRule?.extra?.title : null) ?? this.currentRule?.title ?? '';
  }

  // NEW: the 💡 fun fact shown under the rule
  get shownFun(): string {
    return (this.showExtra ? this.currentRule?.extra?.fun : this.currentRule?.fun) ?? '';
  }

  get nextRuleLabel(): string {
    if (this.currentRule?.extra && !this.showExtra) return 'Next →';
    return this.isLastRule ? 'Start the questions' : 'Next rule →';
  }

  // true only on the Part 2 intro card that has the list of rules
  get isRulesIntro(): boolean {
    return this.isInfoQuestion && !!this.currentQuestion?.rules;
  }

  get currentRule(): any {
    return this.currentQuestion?.rules?.[this.ruleIndex];
  }

  get isLastRule(): boolean {
    return this.ruleIndex >= (this.currentQuestion?.rules?.length ?? 1) - 1;
  }

  // on the last rule, "Next" moves on to the first Part 2 question
  nextRule() {
    if (this.currentRule?.extra && !this.showExtra) {
      this.showExtra = true;
      return;
    }
    if (this.isLastRule) {
      this.nextQuestion();
    } else {
      this.ruleIndex++;
      this.showExtra = false;
    }
  }

  prevRule() {
    if (this.showExtra) {
      this.showExtra = false;
      return;
    }
    if (this.ruleIndex > 0) {
      this.ruleIndex--;
      this.showExtra = !!this.currentRule?.extra;
    }
  }

  // which part the learner is in (1 or 2)
  get currentPartNumber(): number {
    return (this.currentQuestion?.part ?? 0) + 1;
  }

  // 0-based part shown as current in the stepper (moves on while the Part complete card is open)
  get shownPart(): number {
    return (this.currentQuestion?.part ?? 0) + (this.showPartBreak ? 1 : 0);
  }

  // text on the Next button
  get nextLabel(): string {
    if (this.currentQuestionIndex === this.quizQuestions.length - 1) return 'Finish';
    const next = this.quizQuestions[this.currentQuestionIndex + 1];
    if (next && next.part !== this.currentQuestion?.part) return `Finish Part ${this.currentPartNumber}`;
    return 'Next';
  }

  // the intro cards are not scored, everything else is
  get scoredTotal(): number {
    return this.quizQuestions.filter(q => q.type !== 'info').length;
  }

  // score for each part, shown on the results screen
  get partStats(): { number: number; name: string; correct: number; total: number }[] {
    return this.parts.map((name, p) => ({
      number: p + 1,
      name,
      correct: this.correctByPart[p] ?? 0,
      total: this.quizQuestions.filter(q => q.part === p && q.type !== 'info').length
    }));
  }

  // percentage for the part that was just finished (used by the Part complete card)
  get partPercent(): number {
    const s = this.partStats[this.currentPartNumber - 1];
    return s && s.total ? Math.floor((s.correct / s.total) * 100) : 0;
  }

  get partMessage(): string {
    const p = this.partPercent;
    if (p >= 85) return 'Excellent work!';
    if (p >= 70) return "Great job, you're on track.";
    if (p >= 50) return 'Good effort. Part 2 will build on this.';
    return 'Tricky one. Keep going, you can retry at the end.';
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
    // Preload every picture so the quiz never shows a blank image
    this.quizQuestions.forEach((q: any) => {
      if (q.image) {
        const img = new Image();
        img.src = q.image;
      }

      q.rules?.forEach((r: any) => {
        const img = new Image();
        img.src = r.image;
        if (r.extra?.image) {
          const img2 = new Image();
          img2.src = r.extra.image;
        }
      });
    });

    // Only one video plays at a time
    document.addEventListener('play', this.onAnyPlay, true);

    // Pause the How to apply video when less than 25% of it is on screen
    const video = this.applyVideo?.nativeElement;
    if (video) {
      this.videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.intersectionRatio < 0.25 && !video.paused) {
              video.pause();
            }
          });
        },
        { threshold: [0, 0.25] }
      );
      this.videoObserver.observe(video);
    }
  }

  /* ---------------- QUIZ METHODS ---------------- */
  openQuiz() {
    this.pauseAllVideos();
    const saved = this.readProgress();
    if (saved) {
      this.savedProgress = saved;
      this.showResumePrompt = true;   // ask: resume / start over / close
      return;
    }
    this.startFresh();
  }

  startFresh() {
    this.clearProgress();
    this.showResumePrompt = false;
    this.showPartBreak = false;
    this.currentQuestionIndex = 0;
    this.totalCorrect = 0;
    this.correctByPart = this.parts.map(() => 0);
    this.loadQuestion();
    this.showQuiz = true;
    this.stopTimer();
  }

  resumeQuiz() {
    const s = this.savedProgress;
    if (!s) { this.startFresh(); return; }

    this.showResumePrompt = false;
    this.showPartBreak = false;
    this.totalCorrect = s.totalCorrect;
    this.correctByPart = [...s.correctByPart];

    // They answered the very last question but never pressed Finish
    if (s.index >= this.quizQuestions.length) {
      this.clearProgress();
      this.showQuizCompletedPopup = true;
      return;
    }

    this.currentQuestionIndex = s.index;
    this.loadQuestion();
    this.showQuiz = true;
  }

  closeResumePrompt() {
    this.showResumePrompt = false;    // progress stays saved
  }

  closeQuiz() {
    this.showQuiz = false;
    this.feedback = '';
    this.userAnswer = null;
    this.isCorrect = false;
    this.answered = false;
    this.revealed = false;
    this.quizCompleted = false;
    this.selectedOption = null;
  }

  loadQuestion() {
    this.currentQuestion = this.quizQuestions[this.currentQuestionIndex];
    this.userAnswer = null;
    this.feedback = '';
    this.isCorrect = false;
    this.answered = false;
    this.revealed = false;
    this.imageLoaded = false;
    this.ruleIndex = 0;
    this.showExtra = false;
    this.selectedOption = null;
    this.startTimer();
    this.saveProgress(this.currentQuestionIndex);
  }

  // one place to count a correct answer, overall and for its part
  private markCorrect() {
    this.isCorrect = true;
    this.totalCorrect++;
    this.correctByPart[this.currentQuestion.part]++;
  }

  checkAnswer() {
    if (this.isInfoQuestion || this.isMcq) return;
    if (this.userAnswer === null || this.answered) return;
    this.answered = true;
    this.stopTimer();

    if (Math.abs(this.userAnswer - this.currentQuestion.answer) < 0.05) {
      this.markCorrect();
    } else {
      this.isCorrect = false;
    }

    this.saveProgress(this.currentQuestionIndex + 1);
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.quizQuestions.length - 1) {
      const next = this.quizQuestions[this.currentQuestionIndex + 1];
      if (next.part !== this.currentQuestion.part) {
        // end of a part: show the Part complete card
        this.showPartBreak = true;
        return;
      }
      this.currentQuestionIndex++;
      this.loadQuestion();
    } else {
      this.stopTimer();
      this.clearProgress();
      this.quizCompleted = true;
      this.showQuiz = false;
      this.showQuizCompletedPopup = true;
    }
  }

  continueToNextPart() {
    this.showPartBreak = false;
    this.currentQuestionIndex++;
    this.loadQuestion();
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
    this.correctByPart = this.parts.map(() => 0);
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
      this.markCorrect();
    } else {
      this.isCorrect = false;
    }

    this.saveProgress(this.currentQuestionIndex + 1);
  }

  // Only works once an admin has enabled answers. It reveals the result but never changes the mark.
  revealAnswer() {
    if (!this.answersEnabled || !this.answered || this.revealed) return;
    this.revealed = true;

    if (this.isMcq) {
      this.feedback = this.isCorrect
        ? `✅ Correct! ${this.currentQuestion.explanation}`
        : `❌ Wrong. ${this.currentQuestion.explanation}`;
    } else {
      this.feedback = this.isCorrect
        ? '✅ Correct! Well done.'
        : `❌ Wrong. The answer is ${this.currentQuestion.answer}.`;
    }
  }

  optionClass(i: number): string {
    if (!this.answered) {
      return 'border-slate-200 bg-white text-slate-800 hover:border-sky-400';
    }

    // Answers hidden: only show which option the learner picked, in a neutral colour
    if (!this.revealed) {
      return i === this.selectedOption
        ? 'border-sky-500 bg-sky-50 text-sky-800'
        : 'border-slate-200 bg-white text-slate-400';
    }

    // Answers revealed (admin enabled + learner pressed Check answer)
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
    this.pauseAllVideos();
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
