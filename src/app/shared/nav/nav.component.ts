import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { LearnerAPiService } from '../../learner-api.service';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { JoinFormService } from '../../join-form.service';
import { AuthService, LearnerProfile } from '../../auth.service';
import { smoothScrollToId, smoothScrollToY } from '../smooth-scroll';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [LearnerAPiService, AuthService],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {

  // learner info from API
  joinedLearners: any = [];

  // Popup / menu state
  isMobileMenuOpen = false;   // (this is the Sign up popup)
  isContactMenuOpen = false;
  isContactFormOpen = false;
  isNavMenuOpen = false;
  menuClosing = false;   // plays the menu's exit animation
  isLoginFormOpen = false;

  // NEW: messages shown inside the popups (replaces alert boxes)
  signupDone = false;
  signupError = '';
  loginNotice = '';
  contactDone = false;
  contactDoneText = '';
  contactError = '';
  contactSending = false;

  // NEW: navigation helpers
  sections = [
    { id: 'about-us', label: 'What we offer' },
    { id: 'demo-lesson', label: 'Free demo lesson' },
    { id: 'how-to-apply', label: 'How to apply' },
    { id: 'payment', label: 'Payment details' },
    { id: 'special-classes', label: 'Special request classes' },
  ];
  activeSection = '';
  progress = 0;
  showBar = false;

  // Set to true when registrations reopen
  registrationsOpen = true;

  // Join form fields
  learnerFirstName = '';
  learnerSurname = '';
  grade = '';
  email = '';
  schoolName = '';
  parentFullName = '';
  parentCell = '';
  isSubmitting = false;

  // Contact form state
  contactFormType: 'whatsapp' | 'email' = 'whatsapp';
  whatsappNumber = '';
  whatsappMessage = '';
  emailAddress = '';
  emailMessage = '';

  // Login form state
  loginEmail = '';
  loginPassword = '';

  constructor(
    private learnerApiService: LearnerAPiService,
    private http: HttpClient,
    private joinForm: JoinFormService,
    private auth: AuthService
  ) { }  // (removed: document.body.style.backgroundColor = 'white')

  ngOnInit() {
    // Hero "Sign up" button -> open the join form
    this.joinForm.openRequested$.subscribe(() => {
      this.isMobileMenuOpen = true;
    });

    // "Book a special request session" button -> open the contact form
    this.joinForm.contactRequested$.subscribe(() => {
      this.contactFormType = 'whatsapp';
      if (!this.whatsappMessage) {
        this.whatsappMessage = 'Hi, I would like to book a special request class.';
      }
      this.isContactFormOpen = true;
    });

    // Any "Contact us" button on the page -> open the contact form on the chosen tab
    this.joinForm.contactSheetRequested$.subscribe(type => {
      this.contactFormType = type;
      this.contactDone = false;
      this.contactError = '';
      this.isContactFormOpen = true;
    });

    // Hero "Log in" button -> open the login form
    this.joinForm.loginRequested$.subscribe(() => this.openLoginForm());

    // this.learnerApiService.getLearnerInfo()
    //   .pipe(tap(data => { this.joinedLearners = data; }))
    //   .subscribe();
    // this.loadLearners();
  }

  /* ---------------- NEW: scroll tracking + keyboard ---------------- */
  @HostListener('window:scroll')
  onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    this.progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    this.showBar = window.scrollY > window.innerHeight * 0.7;

    let current = '';
    for (const s of this.sections) {
      const el = document.getElementById(s.id);
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.35) current = s.id;
    }
    this.activeSection = current;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isLoginFormOpen) this.closeLoginForm();
    else if (this.isMobileMenuOpen) this.closeForm();
    else if (this.isContactFormOpen) this.closeContactForm();
    else if (this.isNavMenuOpen) this.closeNavMenu();
  }

  /* ---------------- Join form ---------------- */
  toggleMobileMenu() { this.signupDone = false; this.signupError = ''; this.isMobileMenuOpen = true; }
  closeForm() { this.isMobileMenuOpen = false; this.signupDone = false; this.signupError = ''; }

  submitForm() {
    if (!this.registrationsOpen || this.isSubmitting) return;

    if (!(this.learnerFirstName && this.learnerSurname && this.grade && this.email &&
      this.schoolName && this.parentFullName && this.parentCell)) {
      this.signupError = 'Please fill in every field.';
      return;
    }

    this.signupError = '';
    this.isSubmitting = true;

    const learnerData = {
      LearnerFirstName: this.learnerFirstName,
      LearnerSurname: this.learnerSurname,
      Grade: this.grade,
      Email: this.email,
      SchoolName: this.schoolName,
      ParentFullName: this.parentFullName,
      ParentCell: this.parentCell
    };

    this.learnerApiService.addLearner(learnerData).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;

        if (!res?.success) {
          this.signupError = res?.message || 'We could not sign you up. Please try again.';
          return;
        }

        this.signupDone = true;
        this.learnerFirstName = '';
        this.learnerSurname = '';
        this.grade = '';
        this.email = '';
        this.schoolName = '';
        this.parentFullName = '';
        this.parentCell = '';
        this.loadLearners();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error adding learner:', err);
        this.signupError = 'We could not sign you up. Check your internet connection and try again.';
      }
    });
  }

  // loadLearners() {
  //   this.learnerApiService.getLearnerInfo().subscribe({
  //     next: (data) => this.joinedLearners = data,
  //     error: (err) => console.error('Error fetching learners:', err)
  //   });
  // }

  loadLearners() { }

  /* ---------------- Login form ---------------- */
  openLoginForm() {
    if (this.auth.isLoggedIn()) { this.openDashboard(); return; }
    this.loginNotice = '';
    this.isLoginFormOpen = true;
  }
  closeLoginForm() { this.isLoginFormOpen = false; this.loginNotice = ''; this.showChangePassword = false; this.changeError = ''; }

  loginBusy = false;
  showChangePassword = false;
  newPassword = '';
  confirmPassword = '';
  changeError = '';
  changeBusy = false;

  showDashboard = false;
  profile: LearnerProfile | null = null;
  dashError = '';
  dashLoading = false;

  openDashboard() {
    this.showDashboard = true;
    this.dashError = '';
    this.dashLoading = true;
    this.auth.me().subscribe({
      next: p => { this.profile = p; this.dashLoading = false; },
      error: err => {
        this.dashLoading = false;
        if (err?.status === 401) {
          this.auth.logout();
          this.showDashboard = false;
          this.isLoginFormOpen = true;
          this.loginNotice = 'Your session has ended. Please log in again.';
        } else {
          this.dashError = 'We could not load your dashboard. Please try again.';
        }
      }
    });
  }

  closeDashboard() { this.showDashboard = false; }

  logOut() {
    this.auth.logout();
    this.profile = null;
    this.showDashboard = false;
  }

  submitNewPassword() {
    this.changeError = '';
    if (this.newPassword.length < 8) {
      this.changeError = 'Your password must be at least 8 characters.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.changeError = 'The two passwords do not match.';
      return;
    }
    this.changeBusy = true;
    this.auth.changePassword(this.newPassword).subscribe({
      next: () => {
        this.changeBusy = false;
        this.newPassword = '';
        this.confirmPassword = '';
        this.showChangePassword = false;
        this.closeLoginForm();
        this.openDashboard();
      },
      error: () => {
        this.changeBusy = false;
        this.changeError = 'We could not save your password. Please try again.';
      }
    });
  }

  submitLogin() {
    if (this.loginBusy) return;
    this.loginNotice = '';
    this.loginBusy = true;

    this.auth.login(this.loginEmail.trim(), this.loginPassword).subscribe({
      next: (res: any) => {
        this.loginBusy = false;
        this.loginPassword = '';
        if (res?.mustChangePassword) {
          this.loginNotice = '';
          this.showChangePassword = true;
        } else {
          this.closeLoginForm();
          this.openDashboard();
        }
      },
      error: (err) => {
        this.loginBusy = false;
        this.loginPassword = '';
        this.loginNotice = err?.error?.message || 'We could not log you in. Check your connection and try again.';
      }
    });
  }

  /* ---------------- Contact form ---------------- */
  openContactForm() { this.contactDone = false; this.contactError = ''; this.isContactFormOpen = true; }
  closeContactForm() { this.isContactFormOpen = false; this.contactDone = false; this.contactError = ''; }

  sendWhatsappMessage() {
    if (this.contactSending) return;
    if (!this.whatsappNumber || !this.whatsappMessage) {
      this.contactError = 'Add your WhatsApp number and a message.';
      return;
    }
    this.contactError = '';
    this.contactSending = true;

    this.learnerApiService.sendContactWhatsapp({
      whatsappNumber: this.whatsappNumber,
      message: this.whatsappMessage
    }).subscribe({
      next: () => {
        this.contactSending = false;
        this.contactDone = true;
        this.contactDoneText = 'We will contact you shortly on WhatsApp.';
        this.whatsappNumber = '';
        this.whatsappMessage = '';
      },
      error: (err) => {
        this.contactSending = false;
        console.error('Failed to send WhatsApp message:', err);
        this.contactError = 'The message was not sent. Check your connection and try again.';
      }
    });
  }

  sendEmailMessage() {
    if (this.contactSending) return;
    if (!this.emailMessage) {
      this.contactError = 'Write a message first.';
      return;
    }
    this.contactError = '';
    this.contactSending = true;

    this.learnerApiService.sendContactEmail({
      email: 'mathebemoseri@gmail.com', // fixed recipient
      message: this.emailMessage
    }).subscribe({
      next: (res: any) => {
        this.contactSending = false;
        this.contactDone = true;
        this.contactDoneText = res?.message || 'Thank you. We have received your message.';
        this.emailMessage = '';
      },
      error: (err) => {
        this.contactSending = false;
        console.error('Failed to send message:', err);
        this.contactError = 'The message was not sent. Check your connection and try again.';
      }
    });
  }

  /* ---------------- Navigation ---------------- */
  toggleNavMenu() {
    if (this.isNavMenuOpen) this.closeNavMenuAnimated();
    else this.isNavMenuOpen = true;
  }

  closeNavMenu() {
    this.isNavMenuOpen = false;
    this.isContactMenuOpen = false;
    this.menuClosing = false;
  }

  // Fades the menu out first, then removes it, then runs the callback
  closeNavMenuAnimated(after?: () => void) {
    if (!this.isNavMenuOpen) { if (after) setTimeout(after, 80); return; }   // small wait so a closing popup unlocks the page first
    this.menuClosing = true;
    setTimeout(() => {
      this.closeNavMenu();
      if (after) setTimeout(after, 30);   // let the page unlock before scrolling
    }, 220);
  }

  scrollToHero() {
    smoothScrollToY(0);
  }

  // Menu fades out, then the page glides to the section
  goTo(id: string) {
    this.closeNavMenuAnimated(() => smoothScrollToId(id));
  }

  // Menu "Contact us": fade the menu out, then open the contact popup
  openContact(type: 'whatsapp' | 'email' = 'whatsapp') {
    this.closeNavMenuAnimated(() => {
      this.contactFormType = type;
      this.openContactForm();
    });
  }

  openTestimonialsFromMenu() {
    this.closeNavMenu();
    this.joinForm.requestTestimonials();
  }
}
