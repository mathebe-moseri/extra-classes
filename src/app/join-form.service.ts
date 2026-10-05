import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class JoinFormService {
  private openSubject = new Subject<void>();
  openRequested$ = this.openSubject.asObservable();

  private contactSubject = new Subject<void>();
  contactRequested$ = this.contactSubject.asObservable();

  private loginSubject = new Subject<void>();
  loginRequested$ = this.loginSubject.asObservable();

  open() { this.openSubject.next(); }
  openContact() { this.contactSubject.next(); }
  openLogin() { this.loginSubject.next(); }

  // join-form.service.ts
private testimonialsRequestedSubject = new Subject<void>();

testimonialsRequested$ = this.testimonialsRequestedSubject.asObservable();
requestTestimonials() { this.testimonialsRequestedSubject.next(); }
}
