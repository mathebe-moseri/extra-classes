import { Injectable } from '@angular/core';

export interface IntegrityState {
  attemptsLeft: number;          // 2 = fresh, 1 = one strike used, 0 = locked
  lockedUntil: number | null;    // timestamp (ms) when the learner may try again
}

export const MAX_ATTEMPTS = 2;
export const LOCK_DAYS = 30;

/**
 * Keeps track of strikes and the 30-day lockout for each learner.
 *
 * PROTOTYPE: this stores everything in localStorage so you can test for free.
 * A learner can clear it or switch devices, so before using this for real:
 * replace the three private methods (read / write) with calls to your backend
 * (e.g. GET/POST /api/oral/integrity) and store `lockedUntil` on the learner's account.
 * The public methods (get / strike) can stay exactly the same.
 */
@Injectable({ providedIn: 'root' })
export class OralIntegrityService {

  private key(assessmentId: string, owner: string): string {
    return `oral-integrity:${assessmentId}:${(owner ?? '').toLowerCase()}`;
  }

  private read(k: string): IntegrityState | null {
    try {
      const raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private write(k: string, s: IntegrityState) {
    try { localStorage.setItem(k, JSON.stringify(s)); } catch { /* storage blocked */ }
  }

  /** Current state. An expired lock resets the learner to a fresh 2 attempts. */
  get(assessmentId: string, owner: string): IntegrityState {
    const k = this.key(assessmentId, owner);
    const s = this.read(k);
    if (!s) return { attemptsLeft: MAX_ATTEMPTS, lockedUntil: null };

    if (s.lockedUntil && s.lockedUntil <= Date.now()) {
      const fresh = { attemptsLeft: MAX_ATTEMPTS, lockedUntil: null };
      this.write(k, fresh);
      return fresh;
    }
    return s;
  }

  /** Records one strike. On the last attempt, starts the lockout. */
  strike(assessmentId: string, owner: string): IntegrityState {
    const k = this.key(assessmentId, owner);
    const s = this.get(assessmentId, owner);
    if (s.lockedUntil) return s;

    const attemptsLeft = Math.max(0, s.attemptsLeft - 1);
    const next: IntegrityState = {
      attemptsLeft,
      lockedUntil: attemptsLeft === 0 ? Date.now() + LOCK_DAYS * 24 * 60 * 60 * 1000 : null
    };
    this.write(k, next);
    return next;
  }
}
