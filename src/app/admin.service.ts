import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface AdminLearner {
  id: number;
  learnerFirstName: string;
  learnerSurname: string;
  grade: string;
  email: string;
  schoolName: string;
  parentFullName: string;
  parentCell: string;
  paymentVerified: boolean;
  contractReceived: boolean;
  reportCardReceived: boolean;
  accessActivated: boolean;
}

export interface MarkResult {
  activated: boolean;
  emailSent?: boolean;
  tempPassword?: string | null;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  private headers(key: string): HttpHeaders {
    return new HttpHeaders({ 'X-Admin-Key': key });
  }

  list(key: string): Observable<AdminLearner[]> {
    return this.http.get<AdminLearner[]>(`${this.baseUrl}/get_learnerInfo`, { headers: this.headers(key) });
  }

  mark(key: string, email: string, document: 'payment' | 'contract' | 'reportcard'): Observable<MarkResult> {
    return this.http.post<MarkResult>(
      `${this.baseUrl}/admin/mark_document`,
      { email, document },
      { headers: this.headers(key) }
    );
  }
}
