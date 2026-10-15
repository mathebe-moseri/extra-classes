import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService, LearnerProfile } from '../../auth.service';

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

  private readonly topicDefs = [
    { name: 'Parts of a triangle', key: 'parts of a' },
    { name: 'Types of triangles', key: 'types' },
    { name: 'Rules of a triangle', key: 'rules' },
    { name: 'Comparing triangles', key: 'compar|congru|similar' },
    { name: 'Introduction to trigonometry', key: 'trigonometry' }
  ];

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
    this.loadAttempts();
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

  private buildTopics() {
    this.topics = this.topicDefs.map(t => {
      const re = new RegExp(t.key, 'i');
      const hits: { pct: number; date: string }[] = [];
      for (const a of this.attempts) {
        const p = (a.byPart ?? []).find((x: any) => re.test(x.name) && x.total);
        if (p) hits.push({ pct: Math.round(p.correct * 100 / p.total), date: a.date });
      }
      const best = hits.length ? Math.max(...hits.map(h => h.pct)) : 0;
      const status = !hits.length ? 'not-started' : best >= 70 ? 'completed' : 'in-progress';
      const look: any = {
        'not-started': { label: 'Not started', badge: 'bg-slate-100 text-slate-600', bar: 'bg-slate-300', card: 'border-slate-200' },
        'in-progress': { label: 'In progress', badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500', card: 'border-amber-200' },
        'completed': { label: 'Completed', badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500', card: 'border-emerald-200' }
      };
      return {
        name: t.name, status, best, ...look[status],
        latest: hits.length ? hits[hits.length - 1].pct : 0,
        tries: hits.length,
        last: hits.length ? hits[hits.length - 1].date : null
      };
    });
  }

  get completedCount(): number { return this.topics.filter(t => t.status === 'completed').length; }
  get overallPct(): number {
    return this.topics.length ? Math.round(this.completedCount * 100 / this.topics.length) : 0;
  }

  get latest() { return this.attempts[this.attempts.length - 1] ?? null; }
  get best(): number { return Math.max(0, ...this.attempts.map(a => a.percent)); }
  get weakParts() {
    return (this.latest?.byPart ?? []).filter((p: any) => p.total && p.correct / p.total < 0.7);
  }

  logOut() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
