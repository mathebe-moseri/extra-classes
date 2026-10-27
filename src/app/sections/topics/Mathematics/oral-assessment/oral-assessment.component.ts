import { Component, ElementRef, EventEmitter, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../../auth.service';
import { OralIntegrityService, MAX_ATTEMPTS, LOCK_DAYS } from './oral-integrity.service';

/**
 * Leave empty to grade answers with simple keyword matching (free, no setup).
 * To use a real AI, point this at YOUR backend endpoint that calls Gemini / Groq / Claude.
 * Never put an AI API key in this file: anything in the browser can be read by learners.
 * The endpoint receives { question, expected, answer } and returns { score: 0..1, feedback: string }.
 */
const AI_ENDPOINT = '';

const GRACE_MS = 3000;        // time away from the screen that is forgiven (calls, notification bars)
const PASS_MARK = 70;
const RIGHT_AT = 0.67;        // a question counts as correct at this score or above
const ASSESSMENT_ID = 'oral-trig';

type Phase =
  | 'loading' | 'needLogin' | 'locked' | 'intro' | 'starting'
  | 'running' | 'warning' | 'terminated' | 'finished';

interface OralQuestion {
  text: string;
  model: string;          // the expected answer (sent to the AI, shown in review)
  must: string[][];       // groups of accepted words: one match per group scores a point
}

interface OralResult {
  q: OralQuestion;
  answer: string;
  score: number;          // 0 to 1
}

@Component({
  selector: 'app-oral-assessment',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [AuthService],
  templateUrl: './oral-assessment.component.html',
  styleUrls: ['./oral-assessment.component.css']
})
export class OralAssessmentComponent implements OnInit, OnDestroy {
  @Output() closed = new EventEmitter<void>();

  phase: Phase = 'loading';
  readonly maxAttempts = MAX_ATTEMPTS;
  readonly lockDays = LOCK_DAYS;
  readonly passMark = PASS_MARK;
  readonly graceSeconds = GRACE_MS / 1000;

  private owner = '';
  attemptsLeft = MAX_ATTEMPTS;
  lockedUntil: number | null = null;

  consent = false;
  error = '';

  /* ---------------- QUESTIONS ---------------- */
  questions: OralQuestion[] = [
    {
      text: 'In your own words, what do the letters S, O and H stand for in SOH CAH TOA?',
      model: 'Sine equals opposite over hypotenuse.',
      must: [['sine', 'sin'], ['opposite'], ['hypotenuse']]
    },
    {
      text: 'How do you find the longest side of a right-angled triangle when you know the other two sides?',
      model: 'Use Pythagoras: square both short sides, add them, then take the square root.',
      must: [['pythagoras', 'square'], ['add', 'sum', 'plus'], ['square root', 'root']]
    },
    {
      text: 'What do the three angles inside any triangle add up to, and how can you find a missing angle?',
      model: 'They add up to 180 degrees. Subtract the two known angles from 180.',
      must: [['180'], ['subtract', 'minus', 'take away', 'difference']]
    },
    {
      text: 'Explain the difference between an isosceles triangle and an equilateral triangle.',
      model: 'Isosceles has two equal sides; equilateral has three equal sides and three 60 degree angles.',
      must: [['two', '2'], ['three', '3', 'all'], ['equal']]
    },
    {
      text: 'What is an exterior angle of a triangle, and how is it related to the interior angles?',
      model: 'It is the angle outside the triangle at a vertex. It equals the sum of the two opposite interior angles.',
      must: [['outside', 'exterior', 'extend'], ['two', '2', 'sum', 'add'], ['opposite', 'not next', 'not adjacent', 'other']]
    }
  ];

  qIndex = 0;
  results: OralResult[] = [];
  submitted = false;
  checking = false;
  lastFeedback = '';

  /* ---------------- SPEAKING AND LISTENING ---------------- */
  transcript = '';
  typed = '';
  listening = false;
  speaking = false;
  micNote = '';
  showTyping = false;
  private rec: any = null;
  private committed = '';          // text from earlier listening sessions
  private wantListening = false;   // true until the learner presses Stop
  micStatus = '';
  errorCode = '';

  get sttSupported(): boolean {
    const w = window as any;
    return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
  }
  get ttsSupported(): boolean { return 'speechSynthesis' in window; }
  get typingVisible(): boolean { return !this.sttSupported || this.showTyping; }

  /* ---------------- CAMERA AND SCREEN WATCH ---------------- */
  stream: MediaStream | null = null;
  private camEl?: HTMLVideoElement;
  @ViewChild('cam') set camRef(el: ElementRef<HTMLVideoElement> | undefined) {
    this.camEl = el?.nativeElement;
    this.attachStream();
  }

  awayWarn = false;
  faceMissing = false;
  fullscreenOn = false;
  private fsActive = false;
  private monitoring = false;
  private graceTimer: any = null;
  private faceTimer: any = null;

  constructor(private auth: AuthService, private integrity: OralIntegrityService, private zone: NgZone) { }

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit() {
    if (!this.auth.isLoggedIn()) { this.owner = 'guest'; this.refreshState(); return; }
    this.auth.me().subscribe({
      next: p => { this.owner = p.email; this.refreshState(); },
      error: () => { this.error = 'We could not check your account. Please try again.'; this.phase = 'intro'; }
    });
  }

  ngOnDestroy() { this.cleanup(); }

  private refreshState() {
    const s = this.integrity.get(ASSESSMENT_ID, this.owner);
    this.attemptsLeft = s.attemptsLeft;
    this.lockedUntil = s.lockedUntil;
    this.phase = s.lockedUntil ? 'locked' : 'intro';
  }

  get daysLeft(): number {
    return this.lockedUntil ? Math.max(1, Math.ceil((this.lockedUntil - Date.now()) / 86400000)) : 0;
  }

  /* ---------------- START ---------------- */
  async begin() {
    if (!this.consent) return;
    this.error = '';
    this.phase = 'starting';

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    } catch {
      this.error = 'We need your camera and microphone. Allow them in your browser settings and try again.';
      this.phase = 'intro';
      return;
    }

    // Ask for the microphone now, so the permission box never appears mid-question
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic.getTracks().forEach(t => t.stop());
    } catch {
      this.showTyping = true;   // no microphone: the learner can still type answers
    }

    // If the camera is switched off or unplugged during the test, that counts as leaving
    this.stream.getVideoTracks().forEach(t => t.onended = () => this.zone.run(() => this.violation()));

    await this.enterFullscreen();
    this.startMonitoring();
    this.startRun();
  }

  private startRun() {
    this.qIndex = 0;
    this.results = [];
    this.phase = 'running';
    this.loadQuestion();
    this.startFaceWatch();
  }

  async restart() {
    await this.enterFullscreen();
    this.startRun();
  }

  /* ---------------- QUESTIONS ---------------- */
  get current(): OralQuestion { return this.questions[this.qIndex]; }
  get isLast(): boolean { return this.qIndex >= this.questions.length - 1; }
  get answerText(): string { return (this.transcript || this.typed).trim(); }

  private loadQuestion() {
    this.stopListening();
    this.transcript = '';
    this.typed = '';
    this.submitted = false;
    this.checking = false;
    this.lastFeedback = '';
    this.micNote = '';
    this.speak(this.current.text);
  }

  speak(text: string) {
    if (!this.ttsSupported) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-ZA';
    u.rate = 0.95;
    u.onstart = () => this.zone.run(() => this.speaking = true);
    u.onend = () => this.zone.run(() => this.speaking = false);
    u.onerror = () => this.zone.run(() => this.speaking = false);
    synth.speak(u);
  }

  startListening() {
    if (!this.sttSupported || this.submitted || this.listening) return;
    if (this.ttsSupported) window.speechSynthesis.cancel();
    this.speaking = false;
    this.micNote = '';
    this.micStatus = 'Starting the microphone…';
    this.errorCode = '';
    this.wantListening = true;
    this.committed = this.transcript;   // keep anything already said
    this.listening = true;
    this.beginRecognition();
  }

  private beginRecognition() {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;   // continuous mode repeats words on Android

    rec.onaudiostart = () => this.zone.run(() => this.micStatus = 'Microphone is on. Start speaking.');
    rec.onspeechstart = () => this.zone.run(() => this.micStatus = 'Hearing you…');
    rec.onspeechend = () => this.zone.run(() => this.micStatus = 'Processing what you said…');

    rec.onresult = (e: any) => this.zone.run(() => {
      const latest = e.results[e.results.length - 1][0].transcript;
      this.transcript = (this.committed + ' ' + latest).trim();
    });

    rec.onerror = (e: any) => this.zone.run(() => {
      this.errorCode = e.error;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.wantListening = false;
        this.micNote = 'Speech recognition is blocked. Type your answer instead.';
        this.showTyping = true;
      } else if (e.error === 'no-speech') {
        // Nothing heard yet: stay on and keep trying until the learner presses Stop
        this.micStatus = 'We did not hear anything. Speak a little louder or closer.';
      } else if (e.error !== 'aborted') {
        this.wantListening = false;
        this.micNote = 'Listening stopped. Tap the microphone to continue, or type your answer.';
      }
    });

    rec.onend = () => this.zone.run(() => {
      this.committed = this.transcript;
      if (this.wantListening) {
        // The browser stops after a pause: start again until the learner presses Stop
        setTimeout(() => { if (this.wantListening) this.beginRecognition(); }, 30);
      } else {
        this.listening = false;
      }
    });

    this.rec = rec;
    try { rec.start(); } catch { this.listening = false; this.wantListening = false; }
  }

  /** Moves the heard text into the typing box so the learner can correct it */
  editAnswer() {
    this.stopListening();
    this.typed = this.transcript || this.typed;
    this.transcript = '';
    this.committed = '';
    this.showTyping = true;
  }

  stopListening() {
    this.wantListening = false;
    try { this.rec?.stop(); } catch { }
    this.listening = false;
    this.micStatus = '';
  }

  async submit() {
    if (this.submitted || this.checking || !this.answerText) return;
    this.stopListening();
    this.checking = true;

    const answer = this.answerText;
    const graded = await this.grade(this.current, answer);

    // The learner may have been stopped while the AI was thinking
    if (this.phase !== 'running') return;

    this.results.push({ q: this.current, answer, score: graded.score });
    this.lastFeedback = graded.feedback;
    this.checking = false;
    this.submitted = true;
  }

  next() {
    if (this.isLast) { this.finish(); return; }
    this.qIndex++;
    this.loadQuestion();
  }

  /* ---------------- GRADING ---------------- */
  private async grade(q: OralQuestion, answer: string): Promise<{ score: number; feedback: string }> {
    if (AI_ENDPOINT) {
      try {
        const res = await fetch(AI_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q.text, expected: q.model, answer })
        });
        if (res.ok) {
          const d = await res.json();
          const score = Math.min(1, Math.max(0, Number(d.score)));
          if (Number.isFinite(score)) return { score, feedback: String(d.feedback ?? 'Answer recorded.') };
        }
      } catch { /* fall back to keyword grading below */ }
    }
    return this.keywordGrade(q, answer);
  }

  private keywordGrade(q: OralQuestion, answer: string): { score: number; feedback: string } {
    const text = answer.toLowerCase();
    const hit = q.must.filter(group => group.some(k => text.includes(k))).length;
    return { score: q.must.length ? hit / q.must.length : 0, feedback: 'Answer recorded.' };
  }

  /* ---------------- RESULTS ---------------- */
  get totalCorrect(): number { return this.results.filter(r => r.score >= RIGHT_AT).length; }
  get percent(): number {
    return this.questions.length ? Math.floor((this.totalCorrect / this.questions.length) * 100) : 0;
  }
  get passed(): boolean { return this.percent >= PASS_MARK; }

  private finish() {
    this.phase = 'finished';
    this.cleanup();
    this.saveAttempt();
  }

  private saveAttempt() {
    if (!this.auth.isLoggedIn()) return;
    this.auth.saveAttempt({
      quiz: 'Oral assessment: Trigonometry',
      correct: this.totalCorrect,
      total: this.questions.length,
      details: JSON.stringify({
        byPart: [{ name: 'Oral questions', correct: this.totalCorrect, total: this.questions.length }],
        answers: this.results.map(r => ({
          text: r.q.text,
          given: r.answer,
          correct: r.q.model,
          ok: r.score >= RIGHT_AT,
          explanation: ''
        }))
      })
    }).subscribe({ error: () => { /* the result is still shown */ } });
  }

  /* ---------------- SCREEN WATCH ---------------- */
  private async enterFullscreen() {
    const el: any = document.documentElement;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        this.fsActive = !!document.fullscreenElement;
      }
    } catch { this.fsActive = false; }   // iPhone Safari does not allow this: the other checks still work
    this.fullscreenOn = this.fsActive;
  }

  private isAway(): boolean {
    return document.hidden
      || !document.hasFocus()
      || (this.fsActive && !document.fullscreenElement);
  }

  private check = () => {
    if (this.phase !== 'running') return;
    if (this.isAway()) {
      if (!this.graceTimer) {
        this.awayWarn = true;
        this.graceTimer = setTimeout(() => {
          this.graceTimer = null;
          if (this.phase === 'running' && this.isAway()) this.violation();
        }, GRACE_MS);
      }
    } else {
      this.clearGrace();
    }
  };

  private clearGrace() {
    if (this.graceTimer) { clearTimeout(this.graceTimer); this.graceTimer = null; }
    this.awayWarn = false;
  }

  private startMonitoring() {
    if (this.monitoring) return;
    this.monitoring = true;
    document.addEventListener('visibilitychange', this.check);
    document.addEventListener('fullscreenchange', this.check);
    window.addEventListener('blur', this.check);
    window.addEventListener('focus', this.check);
    window.addEventListener('pagehide', this.check);
  }

  private stopMonitoring() {
    if (!this.monitoring) return;
    this.monitoring = false;
    document.removeEventListener('visibilitychange', this.check);
    document.removeEventListener('fullscreenchange', this.check);
    window.removeEventListener('blur', this.check);
    window.removeEventListener('focus', this.check);
    window.removeEventListener('pagehide', this.check);
  }

  /** Shows a banner if no face is seen. Uses the browser's FaceDetector where it exists (Chrome on Android). */
  private startFaceWatch() {
    clearInterval(this.faceTimer);
    const FD = (window as any).FaceDetector;
    if (!FD) return;
    let detector: any;
    try { detector = new FD({ fastMode: true, maxDetectedFaces: 2 }); } catch { return; }
    this.faceTimer = setInterval(async () => {
      if (!this.camEl || this.phase !== 'running') return;
      try {
        const faces = await detector.detect(this.camEl);
        this.zone.run(() => this.faceMissing = faces.length === 0);
      } catch { /* detection not available: ignore */ }
    }, 3000);
  }

  private attachStream() {
    if (this.camEl && this.stream && this.camEl.srcObject !== this.stream) {
      this.camEl.srcObject = this.stream;
      this.camEl.play().catch(() => { });
    }
  }

  /** The learner left the screen (or switched the camera off) for longer than the grace time */
  private violation() {
    if (this.phase !== 'running') return;
    this.stopListening();
    if (this.ttsSupported) window.speechSynthesis.cancel();
    this.clearGrace();

    const s = this.integrity.strike(ASSESSMENT_ID, this.owner);
    this.attemptsLeft = s.attemptsLeft;
    this.lockedUntil = s.lockedUntil;

    if (s.lockedUntil) {
      this.phase = 'terminated';
      this.cleanup();
    } else {
      this.phase = 'warning';
      if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
      this.fsActive = false;
    }
  }

  /* ---------------- CLOSE AND CLEAN UP ---------------- */
  close() {
    if (this.phase === 'running') {
      const ok = window.confirm('If you leave now, this uses one of your attempts. Leave anyway?');
      if (!ok) return;
      this.integrity.strike(ASSESSMENT_ID, this.owner);
    }
    this.cleanup();
    this.closed.emit();
  }

  private cleanup() {
    this.stopMonitoring();
    this.clearGrace();
    clearInterval(this.faceTimer);
    this.faceTimer = null;
    this.stopListening();
    if (this.ttsSupported) window.speechSynthesis.cancel();
    this.stream?.getTracks().forEach(t => { t.onended = null; t.stop(); });
    this.stream = null;
    this.fsActive = false;
    this.fullscreenOn = false;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
  }
}
