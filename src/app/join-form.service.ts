import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class JoinFormService {
  private openSubject = new Subject<void>();
  openRequested$ = this.openSubject.asObservable();

  open() {
    this.openSubject.next();
  }
}