import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService, LearnerProfile } from '../../auth.service';
import { QuizLauncherService } from '../../quiz-launcher.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  providers: [AuthService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  profile: LearnerProfile | null = null;
  loading = true;
  error = '';
  attempts: any[] = [];
  showAll = false;
  topics: any[] = [];
  assessments = [
    { id: 'all', name: 'Trigonometry', icon: '📐', desc: 'Triangles, their rules and SOH CAH TOA' },
    { id: 'patterns', name: 'Number patterns', icon: '🔢', desc: 'Finding any term with Tn = a + (n − 1)d' },
    { id: 'measurement', name: 'Measurement', icon: '📦', desc: 'Surface area and volume of solids' },
    { id: 'algebra', name: 'Algebra', icon: '🧮', desc: 'Grade 9 to 10: expressions, equations and graphs' }
  ];
  board: any = null;
  boardLoading = true;
  boardTab = 'overall';

  private readonly topicDefs = [
    { id: 'parts', name: 'Parts of a triangle', key: 'parts of a' },
    { id: 'types', name: 'Types of triangles', key: 'types' },
    { id: 'rules', name: 'Rules of a triangle', key: 'rules' },
    { id: 'compare', name: 'Comparing triangles', key: 'compar|congru|similar' },
    { id: 'trig', name: 'Introduction to trigonometry', key: 'trigonometry' }
  ];

  constructor(private auth: AuthService, private router: Router,
    private launcher: QuizLauncherService) { }
  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
    this.loadAttempts();
    this.loadBoard();
    this.auth.me().subscribe({
      next: p => { this.profile = p; this.loading = false; },
      error: err => {
        this.loading = false;
        if (err?.status === 401) {
          this.auth.logout();
          this.router.navigate(['/']);
        } else {
          this.error = 'We could not load your dashboard. Please try again.';
        }
      }
    });
  }

  private loadAttempts() {
    this.auth.myAttempts().subscribe({
      next: list => {
        this.attempts = list.map(a => {
          let d: any = {};
          try { d = JSON.parse(a.details || '{}'); } catch { }
          const answers: any[] = d.answers ?? [];
          return { ...a, byPart: d.byPart ?? [], answers, wrong: answers.filter(x => !x.ok) };
        });
        this.buildTopics();
      },
      error: () => { this.attempts = []; this.buildTopics(); }
    });
  }

  private loadBoard() {
    this.auth.leaderboard().subscribe({
      next: (b: any) => { this.board = b; this.boardLoading = false; },
      error: () => { this.board = null; this.boardLoading = false; }
    });
  }

  private buildTopics() {
    const labels: any = {
      'not-started': 'Not started',
      'in-progress': 'In progress',
      'completed': 'Completed'
    };
    this.topics = this.topicDefs.map(t => {
      const re = new RegExp(t.key, 'i');
      const hits: { pct: number; date: string }[] = [];
      for (const a of this.attempts) {
        const p = (a.byPart ?? []).find((x: any) => re.test(x.name) && x.total);
        if (p) hits.push({ pct: Math.round(p.correct * 100 / p.total), date: a.date });
      }
      const best = hits.length ? Math.max(...hits.map(h => h.pct)) : 0;
      const status = !hits.length ? 'not-started' : best >= 70 ? 'completed' : 'in-progress';
      return {
        id: t.id, name: t.name, status, best, label: labels[status],
        latest: hits.length ? hits[hits.length - 1].pct : 0,
        tries: hits.length,
        last: hits.length ? hits[hits.length - 1].date : null
      };
    });
  }

  // ----- progress -----
  get completedCount(): number { return this.topics.filter(t => t.status === 'completed').length; }
  get overallPct(): number {
    return this.topics.length ? Math.round(this.completedCount * 100 / this.topics.length) : 0;
  }
  get latest() { return this.attempts[this.attempts.length - 1] ?? null; }
  get best(): number { return Math.max(0, ...this.attempts.map(a => a.percent)); }
  get weakParts() {
    return (this.latest?.byPart ?? []).filter((p: any) => p.total && p.correct / p.total < 0.7);
  }

  // ----- profile -----
  get initials(): string {
    const f = this.profile?.firstName?.charAt(0) ?? '';
    const s = this.profile?.surname?.charAt(0) ?? '';
    return (f + s).toUpperCase();
  }
  get level(): string {
    const p = this.overallPct;
    return p >= 80 ? 'Champion' : p >= 50 ? 'Achiever' : p >= 20 ? 'Rising star' : 'Starter';
  }

  // ----- comparison with other learners -----
  get overall() { return this.board?.overall ?? null; }
  get heroMessage(): string {

    if (this.hasSavedQuiz) return 'You have a quiz in progress. Continue where you stopped.';

    if (!this.attempts.length) return 'Complete the quiz to join the leaderboard and see how you compare.';
    const o = this.overall;
    if (o?.beatPercent != null) return `You are ahead of ${o.beatPercent}% of learners. Keep climbing!`;
    return `${this.completedCount} of ${this.topics.length} topics completed. Keep going!`;
  }
  statsFor(id: string): any {
    const s = (this.board?.topics ?? []).find((t: any) => t.id === id);
    return s && s.participants > 0 ? s : null;
  }
  get tabs() {
    return [{ id: 'overall', name: 'Overall' }, ...this.topicDefs.map(t => ({ id: t.id, name: t.name }))];
  }
  get activeBoard(): any {
    if (!this.board) return null;
    return this.boardTab === 'overall'
      ? this.board.overall
      : (this.board.topics ?? []).find((t: any) => t.id === this.boardTab) ?? null;
  }
  abs(n: number) { return Math.abs(n); }

  // ----- redesign helpers -----
  readonly navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
    { id: 'assessments', name: 'My Assessments', icon: '📝' },
    { id: 'resources', name: 'Learning Resources', icon: '📖' },
    { id: 'progress', name: 'Progress', icon: '📈' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];
  activeNav = 'dashboard';

  private readonly assessmentTotals: Record<string, number> = {
    all: 5, patterns: 3, measurement: 3, algebra: 13
  };

  // progress for each card in "Recent Activity"
  assessmentProgress(id: string) {
    const total = this.assessmentTotals[id] ?? 0;
    if (id === 'all') {
      return { pct: this.overallPct, done: this.completedCount, total };
    }
    if (id === 'algebra') {
      const bestByTopic: Record<string, number> = {};
      for (const a of this.attempts) {
        if (!/^algebra/i.test(a.quiz ?? '')) continue;
        for (const p of a.byPart ?? []) {
          if (!p.total) continue;
          const pct = Math.round(p.correct * 100 / p.total);
          bestByTopic[p.name] = Math.max(bestByTopic[p.name] ?? 0, pct);
        }
      }
      const done = Object.values(bestByTopic).filter(v => v >= 70).length;
      return { pct: total ? Math.round(done * 100 / total) : 0, done, total };
    }
    return { pct: 0, done: 0, total };
  }

  // used by the circular progress ring in the hero card
  get ringDash(): string { return `${this.overallPct}, 100`; }

  // greeting on the welcome banner
  get firstName(): string { return this.profile?.firstName ?? 'Learner'; }

  // the "Latest Questions" strip: 4 most recent answers from the last attempt
  get latestQuestions() {
    return (this.latest?.answers ?? []).slice(-4).reverse();
  }

  setNav(id: string) { this.activeNav = id; }

  // the topic we suggest next: lowest-scoring in-progress topic, else the first not-started one
  get nextTopic() {
    const open = this.topics.filter(t => t.status === 'in-progress');
    const pool = open.length ? open : this.topics.filter(t => t.status === 'not-started');
    return pool.length ? pool.reduce((a, b) => (b.best < a.best ? b : a)) : null;
  }    // true when a Trigonometry quiz was started and closed before finishing
  get hasSavedQuiz(): boolean {
    try {
      const raw = localStorage.getItem('trig-quiz-progress-v3');
      if (!raw) return false;
      const p = JSON.parse(raw);
      return Number.isInteger(p.index) && p.index > 0;
    } catch { return false; }
  }

  logOut() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  startQuiz(topicId?: string) {
    this.launcher.request(topicId ?? 'all');
    this.router.navigate(['/']);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
