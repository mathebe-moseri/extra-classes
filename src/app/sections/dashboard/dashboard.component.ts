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
      },
      error: () => { this.attempts = []; }
    });
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
