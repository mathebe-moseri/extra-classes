import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService, LearnerProfile } from '../../auth.service';
import { QuizLauncherService } from '../../quiz-launcher.service';
import { QuizProgressService, ProgressSummary } from '../../quiz-progress.service';

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
    private launcher: QuizLauncherService, private progress: QuizProgressService) { }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
    this.loadAttempts();
    this.loadBoard();
    this.auth.me().subscribe({
      next: p => {
        // Tell the quizzes whose progress to save, then rebuild what the dashboard shows
        this.progress.setOwner(p.email);
        this.buildTopics();
        this.profile = p;
        this.loading = false;
      },
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
    const saved = this.progress.summary('all');   // answers saved while the quiz was still open

    this.topics = this.topicDefs.map(t => {
      const re = new RegExp(t.key, 'i');
      const hits: { pct: number; date: string }[] = [];
      for (const a of this.attempts) {
        const p = (a.byPart ?? []).find((x: any) => re.test(x.name) && x.total);
        if (p) hits.push({ pct: Math.round(p.correct * 100 / p.total), date: a.date });
      }

      // Even one answered question puts the topic "In progress"
      const part = saved?.topics.find(x => re.test(x.name));
      const answered = part?.answered ?? 0;

      const best = hits.length ? Math.max(...hits.map(h => h.pct)) : 0;
      const status = !hits.length
        ? (answered ? 'in-progress' : 'not-started')
        : best >= 70 ? 'completed' : 'in-progress';
      return {
        id: t.id, name: t.name, status, best, label: labels[status],
        latest: hits.length ? hits[hits.length - 1].pct : 0,
        tries: hits.length,
        last: hits.length ? hits[hits.length - 1].date : null,
        answered,
        qTotal: part?.total ?? 0
      };
    });

    this.refreshProgress();
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

  // ----- "My progress": questions answered in every assessment, finished or not -----
  progressRows: { id: string; name: string; icon: string; sum: ProgressSummary | null }[] = [];
  totalAnswered = 0;

  /** Rebuilds the progress card. Uses the answers saved while quizzes were open, or the finished attempts, whichever is further. */
  private refreshProgress() {
    this.progressRows = this.assessments.map(a => {
      const local = this.progress.summary(a.id);
      const server = this.fromAttempts(a.id);
      const sum = local && server
        ? (local.answered >= server.answered ? local : server)
        : (local ?? server);
      return { id: a.id, name: a.name, icon: a.icon, sum };
    });
    this.totalAnswered = this.progressRows.reduce((n, r) => n + (r.sum?.answered ?? 0), 0);
  }

  /** Progress worked out from finished attempts saved on the server (older attempts) */
  private fromAttempts(id: string): ProgressSummary | null {
    const rx = id === 'algebra' ? /^algebra/i
      : id === 'all' ? /^introduction to trigonometry/i
        : null;
    if (!rx) return null;

    const best: Record<string, { correct: number; total: number }> = {};
    let last: string | null = null;
    for (const a of this.attempts) {
      if (!rx.test(a.quiz ?? '')) continue;
      last = a.date ?? last;
      for (const p of a.byPart ?? []) {
        if (!p.total) continue;
        const old = best[p.name];
        if (!old || p.correct > old.correct) best[p.name] = { correct: p.correct, total: p.total };
      }
    }

    const names = Object.keys(best);
    if (!names.length) return null;
    const topics = names.map(name => ({
      name, answered: best[name].total, correct: best[name].correct, total: best[name].total, pct: 100
    }));
    const total = topics.reduce((s, t) => s + t.total, 0);
    const correct = topics.reduce((s, t) => s + t.correct, 0);
    return { answered: total, correct, total, pct: 100, topics, updated: last };
  }

  pgStatus(sum: ProgressSummary | null): 'not-started' | 'in-progress' | 'completed' {
    if (!sum || !sum.answered) return 'not-started';
    return sum.total && sum.answered >= sum.total ? 'completed' : 'in-progress';
  }

  pgLabel(sum: ProgressSummary | null): string {
    const s = this.pgStatus(sum);
    return s === 'completed' ? 'All answered' : s === 'in-progress' ? 'In progress' : 'Not started';
  }

  /** Bar width: even one answered question shows a small visible bar */
  pgWidth(answered: number, pct: number): number {
    return answered > 0 ? Math.max(pct, 4) : 0;
  }

  // small numbers used by the assessment cards
  assessmentProgress(id: string) {
    const sum = this.progressRows.find(r => r.id === id)?.sum;
    return sum
      ? { pct: this.pgWidth(sum.answered, sum.pct), done: sum.answered, total: sum.total }
      : { pct: 0, done: 0, total: 0 };
  }

  // the last 5 finished attempts, newest first
  get recentAttempts() { return this.attempts.slice(-5).reverse(); }

  shortDate(d: any): string {
    const t = new Date(d);
    return isNaN(t.getTime()) ? '' : t.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
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
  }

  // true when a Trigonometry quiz was started and closed before finishing
  get hasSavedQuiz(): boolean {
    try {
      const raw = localStorage.getItem('trig-quiz-progress-v3');
      if (!raw) return false;
      const p = JSON.parse(raw);
      return Number.isInteger(p.index) && p.index > 0;
    } catch { return false; }
  }

  logOut() {
    this.progress.clearOwner();   // the next learner on this device starts clean
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