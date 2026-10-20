import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment'; // use the same line as in LearnerAPiService

export interface LearnerProfile {
  firstName: string;
  surname: string;
  grade: string;
  email: string;
  school: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiBaseUrl;
  private tokenKey = 'learner_token';

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/login`, { email, password })
      .pipe(tap(res => { if (res?.token) localStorage.setItem(this.tokenKey, res.token); }));
  }

  me(): Observable<LearnerProfile> {
    return this.http.get<LearnerProfile>(`${this.baseUrl}/me`, { headers: this.authHeaders() });
  }

  saveAttempt(attempt: { quiz: string; correct: number; total: number; details: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/quiz_attempts`, attempt, { headers: this.authHeaders() });
  }

  saveProgress(items: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/quiz_progress`, { items }, { headers: this.authHeaders() });
  }

  loadProgress(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/quiz_progress`, { headers: this.authHeaders() });
  }

  myAttempts(): Observable<any[]> {    return this.http.get<any[]>(`${this.baseUrl}/quiz_attempts`, { headers: this.authHeaders() });
  }

  leaderboard(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/leaderboard`, { headers: this.authHeaders() });
  }

  changePassword(newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/change_password`, { newPassword }, { headers: this.authHeaders() });
  }

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    const t = this.token;
    if (!t) return false;
    try {
      const payload = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.token}` });
  }
}
