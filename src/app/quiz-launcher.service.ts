import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class QuizLauncherService {
  private pending: string | null = null;
  request(id: string) { this.pending = id; }
  take(): string | null { const p = this.pending; this.pending = null; return p; }
}
