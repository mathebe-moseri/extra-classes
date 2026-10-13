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

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
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

  logOut() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
