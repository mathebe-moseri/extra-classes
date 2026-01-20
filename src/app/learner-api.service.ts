import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LearnerAPiService {
  // ← Update this to your Azure backend URL
  private baseUrl = 'https://sesi-mathebeextraclasses-f5hchpghcxafgrdf.westeurope-01.azurewebsites.net';
  private getUrl = `${this.baseUrl}/get_learnerInfo`;
  private addUrl = `${this.baseUrl}/add_learnerInfo`;

  constructor(private http: HttpClient) { }

  getLearnerInfo(): Observable<any> {
    return this.http.get<any>(this.getUrl);
  }

  addLearner(learner: any): Observable<any> {
    return this.http.post<any>(this.addUrl, learner);
  }
}
