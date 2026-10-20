import { Injectable } from '@angular/core';
import { Observable, tap, map } from 'rxjs';
import { AuthService } from './auth.service';

/** Progress inside one topic of a quiz, e.g. "Grade 9: Exponents" */
export interface TopicProgress {
  name: string;
  answered: number;
  correct: number;
  total: number;
  pct: number;
}

/** Everything the dashboard needs to show for one assessment */
export interface ProgressSummary {
  answered: number;
  correct: number;
  total: number;
  pct: number;
  topics: TopicProgress[];
  updated: string | null;
}

interface Stored {
  total: number;
  totals: Record<string, number>;
  answers: Record<string, { t: string; ok: boolean }>;
  updated: string;
}

/**
 * Remembers every question a learner has answered, even when the quiz is not finished.
 * Saved in this browser, separately for each learner (by email).
 * The dashboard calls setOwner() when it loads, so the quizzes know whose progress to save.
 */
@Injectable({ providedIn: 'root' })
export class QuizProgressService {
  private readonly OWNER_KEY = 'quiz-progress-owner';
  private readonly QUIZZES = ['all', 'patterns', 'measurement', 'algebra'];

  constructor(private auth: AuthService) { }

  setOwner(email: string): void {
    try { localStorage.setItem(this.OWNER_KEY, (email ?? '').toLowerCase()); } catch { /* storage blocked */ }
  }

  clearOwner(): void {
    try { localStorage.removeItem(this.OWNER_KEY); } catch { /* storage blocked */ }
  }

  private key(quiz: string): string | null {
    try {
      const owner = localStorage.getItem(this.OWNER_KEY);
      return owner ? `quiz-progress:${owner}:${quiz}` : null;
    } catch {
      return null;
    }
  }

  private read(quiz: string): Stored | null {
    const k = this.key(quiz);
    if (!k) return null;
    try {
      const raw = localStorage.getItem(k);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d || typeof d !== 'object' || !d.answers || typeof d.answers !== 'object') return null;
      return {
        total: Number(d.total) || 0,
        totals: d.totals ?? {},
        answers: d.answers,
        updated: d.updated ?? ''
      };
    } catch {
      return null;
    }
  }

  /**
   * Save one answered question.
   * quiz   : 'algebra', 'all' (trigonometry), ...
   * key    : a stable id for the question, so answering it again never counts twice
   * topic  : the topic the question belongs to
   * ok     : was the latest answer correct
   * total  : number of scored questions in the whole quiz
   * totals : number of scored questions in each topic
   */
  record(quiz: string, key: string, topic: string, ok: boolean, total: number, totals: Record<string, number>): void {
    const k = this.key(quiz);
    if (!k) return;
    try {
      const data: Stored = this.read(quiz) ?? { total, totals, answers: {}, updated: '' };
      data.total = total;
      data.totals = totals;
      data.answers[key] = { t: topic, ok };
      data.updated = new Date().toISOString();
      localStorage.setItem(k, JSON.stringify(data));
    } catch { /* storage full or blocked: the quiz still works */ }

    // Also keep it in the database so it follows the learner to any device
    if (this.auth.isLoggedIn()) {
      this.auth.saveProgress([{ quiz, key, topic, ok, total, totals }])
        .subscribe({ error: () => { /* offline: still saved in this browser and syncs later */ } });
    }
  }

  /** Loads progress from the database, merges it into this browser, and uploads anything the server is missing */
  pull(): Observable<void> {
    return this.auth.loadProgress().pipe(
      tap(rows => this.merge(rows ?? [])),
      map(() => void 0)
    );
  }

  private merge(rows: any[]): void {
    const byQuiz: Record<string, any[]> = {};
    for (const r of rows) (byQuiz[r.quiz] ??= []).push(r);

    // 1. Server -> browser
    for (const quiz of Object.keys(byQuiz)) {
      const k = this.key(quiz);
      if (!k) continue;
      const list = byQuiz[quiz];
      const data: Stored = this.read(quiz) ?? { total: 0, totals: {}, answers: {}, updated: '' };
      for (const r of list) {
        if (!(r.key in data.answers)) data.answers[r.key] = { t: r.topic, ok: !!r.ok };
      }
      const last = list[list.length - 1];
      data.total = Number(last.total) || data.total;
      try {
        data.totals = typeof last.totals === 'string' ? JSON.parse(last.totals) : (last.totals ?? data.totals);
      } catch { /* keep the old totals */ }
      data.updated = new Date().toISOString();
      try { localStorage.setItem(k, JSON.stringify(data)); } catch { }
    }

    // 2. Browser -> server (answers saved offline, or before this feature existed)
    const missing: any[] = [];
    for (const quiz of this.QUIZZES) {
      const data = this.read(quiz);
      if (!data) continue;
      const onServer = new Set((byQuiz[quiz] ?? []).map(r => r.key));
      for (const key of Object.keys(data.answers)) {
        if (onServer.has(key)) continue;
        const a = data.answers[key];
        missing.push({ quiz, key, topic: a.t, ok: a.ok, total: data.total, totals: data.totals });
      }
    }
    if (missing.length) this.auth.saveProgress(missing).subscribe({ error: () => { } });
  }

  /** The numbers shown on the dashboard, or null when nothing has been answered yet */
  summary(quiz: string): ProgressSummary | null {
    const data = this.read(quiz);
    if (!data) return null;

    const keys = Object.keys(data.answers);
    if (!keys.length) return null;

    const total = Math.max(data.total, keys.length);
    const correct = keys.filter(x => data.answers[x].ok).length;

    const topics: TopicProgress[] = Object.keys(data.totals).map(name => {
      const mine = keys.filter(x => data.answers[x].t === name);
      const t = data.totals[name];
      return {
        name,
        answered: mine.length,
        correct: mine.filter(x => data.answers[x].ok).length,
        total: t,
        pct: t ? Math.min(100, Math.round((mine.length * 100) / t)) : 0
      };
    });

    return {
      answered: keys.length,
      correct,
      total,
      pct: Math.min(100, Math.round((keys.length * 100) / total)),
      topics,
      updated: data.updated || null
    };
  }
}
