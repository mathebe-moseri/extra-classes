import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AdminService, AdminLearner } from '../../admin.service';

type Doc = 'payment' | 'contract' | 'reportcard';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [AdminService],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent {
  docs: { id: Doc; label: string }[] = [
    { id: 'payment', label: 'Proof of payment' },
    { id: 'contract', label: 'Signed contract' },
    { id: 'reportcard', label: 'Report card' }
  ];

  keyInput = '';
  private key = '';
  unlocked = false;
  busy = false;
  error = '';
  notice = '';
  search = '';
  learners: AdminLearner[] = [];

  constructor(private admin: AdminService) {}

  unlock() {
    if (!this.keyInput || this.busy) return;
    this.busy = true;
    this.error = '';
    this.admin.list(this.keyInput).subscribe({
      next: rows => {
        this.key = this.keyInput;
        this.keyInput = '';
        this.learners = rows;
        this.unlocked = true;
        this.busy = false;
      },
      error: err => {
        this.busy = false;
        this.keyInput = '';
        this.error = err?.status === 401 ? 'Wrong admin key.' : 'Could not reach the server. Try again.';
      }
    });
  }

  lock() {
    this.key = '';
    this.unlocked = false;
    this.learners = [];
    this.notice = '';
    this.error = '';
    this.search = '';
  }

  get filtered(): AdminLearner[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.learners;
    return this.learners.filter(l =>
      `${l.learnerFirstName} ${l.learnerSurname} ${l.email} ${l.schoolName}`.toLowerCase().includes(q));
  }

  isDone(l: AdminLearner, d: Doc): boolean {
    return d === 'payment' ? l.paymentVerified : d === 'contract' ? l.contractReceived : l.reportCardReceived;
  }

  private label(d: Doc): string {
    return this.docs.find(x => x.id === d)!.label.toLowerCase();
  }

  mark(l: AdminLearner, d: Doc) {
    if (this.busy || this.isDone(l, d)) return;
    if (!confirm(`Mark the ${this.label(d)} of ${l.learnerFirstName} ${l.learnerSurname} as verified?`)) return;

    this.busy = true;
    this.error = '';
    this.notice = '';

    this.admin.mark(this.key, l.email, d).subscribe({
      next: res => {
        this.busy = false;
        if (d === 'payment') l.paymentVerified = true;
        else if (d === 'contract') l.contractReceived = true;
        else l.reportCardReceived = true;

        if (res.activated) {
          l.accessActivated = true;
          if (res.emailSent) {
            this.notice = `${l.learnerFirstName} is now active and has been emailed their login.`;
          } else if (res.tempPassword) {
            this.notice = `${l.learnerFirstName} is now active, but the email failed. Temporary password: ${res.tempPassword}`;
          } else {
            this.notice = res.message || `${l.learnerFirstName} was already active.`;
          }
        } else {
          this.notice = `Recorded the ${this.label(d)} for ${l.learnerFirstName}.`;
        }
      },
      error: err => {
        this.busy = false;
        this.error = err?.status === 401 ? 'Wrong admin key.' : 'That did not work. Try again.';
      }
    });
  }
}
