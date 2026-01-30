import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LearnerAPiService {
  private baseUrl = environment.apiBaseUrl;
  private getUrl = `${this.baseUrl}/get_learnerInfo`;
  private addUrl = `${this.baseUrl}/add_learnerInfo`;
  private emailUrl = `${this.baseUrl}/send_contact_email`;
  private whatsappUrl = `${this.baseUrl}/send_contact_whatsapp`; // <-- new

  constructor(private http: HttpClient) {}

  getLearnerInfo(): Observable<any> {
    return this.http.get<any>(this.getUrl);
  }

  addLearner(learner: any): Observable<any> {
    return this.http.post<any>(this.addUrl, learner);
  }

  sendContactEmail(payload: { email: string; message: string }): Observable<any> {
    return this.http.post<any>(this.emailUrl, payload);
  }

  sendContactWhatsapp(payload: { whatsappNumber: string; message: string }): Observable<any> {
    return this.http.post<any>(this.whatsappUrl, payload);
  }
}

