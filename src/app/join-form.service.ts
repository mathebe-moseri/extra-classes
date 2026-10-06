import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class JoinFormService {
  private openSubject = new Subject<void>();
  openRequested$ = this.openSubject.asObservable();

  // "Book a special request class": opens the contact form with a ready-made message
  private contactSubject = new Subject<void>();
  contactRequested$ = this.contactSubject.asObservable();

  private loginSubject = new Subject<void>();
  loginRequested$ = this.loginSubject.asObservable();

  private testimonialsRequestedSubject = new Subject<void>();
  testimonialsRequested$ = this.testimonialsRequestedSubject.asObservable();

  // NEW: any "Contact us" button -> opens the contact form on WhatsApp or Email
  private contactSheetSubject = new Subject<'whatsapp' | 'email'>();
  contactSheetRequested$ = this.contactSheetSubject.asObservable();

  open() { this.openSubject.next(); }
  openContact() { this.contactSubject.next(); }
  openLogin() { this.loginSubject.next(); }
  requestTestimonials() { this.testimonialsRequestedSubject.next(); }

  // NEW
  openContactSheet(type: 'whatsapp' | 'email' = 'whatsapp') { this.contactSheetSubject.next(type); }
}
