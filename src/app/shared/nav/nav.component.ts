import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { LearnerAPiService } from '../../learner-api.service';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { JoinFormService } from '../../join-form.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [LearnerAPiService],
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
  isLoginFormOpen = false;

  // NEW: navigation helpers
  sections = [
    { id: 'about-us',        label: 'What we offer' },
    { id: 'demo-lesson',     label: 'Free demo lesson' },
    { id: 'how-to-apply',    label: 'How to apply' },
    { id: 'payment',         label: 'Payment details' },
    { id: 'special-classes', label: 'Special request classes' },
  ];
  activeSection = '';
  progress = 0;
  showBar = false;

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
    private joinForm: JoinFormService
  ) { }   // (removed: document.body.style.backgroundColor = 'white')

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

    // Hero "Log in" button -> open the login form
    this.joinForm.loginRequested$.subscribe(() => {
      this.isLoginFormOpen = true;
    });

    this.learnerApiService.getLearnerInfo()
      .pipe(tap(data => { this.joinedLearners = data; }))
      .subscribe();

    this.loadLearners();
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
  toggleMobileMenu() { this.isMobileMenuOpen = true; }
  closeForm() { this.isMobileMenuOpen = false; }

  submitForm() {
    if (this.isSubmitting) return;

    if (
      this.learnerFirstName && this.learnerSurname &&
      this.grade && this.email && this.schoolName &&
      this.parentFullName && this.parentCell
    ) {
      const learnerData = {
        LearnerFirstName: this.learnerFirstName,
        LearnerSurname: this.learnerSurname,
        Grade: this.grade,
        Email: this.email,
        SchoolName: this.schoolName,
        ParentFullName: this.parentFullName,
        ParentCell: this.parentCell
      };

      this.isSubmitting = true;

      this.learnerApiService.addLearner(learnerData).subscribe({
        next: () => {
          this.isSubmitting = false;
          alert('Welcome to Sesi Mathebe Extra Classes! Your registration was successful. Please check your email for further details.');
          this.isMobileMenuOpen = false;

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
          alert('Failed to add learner. Please try again.');
        }
      });
    } else {
      alert('Please fill all fields.');
    }
  }

  loadLearners() {
    this.learnerApiService.getLearnerInfo().subscribe({
      next: (data) => this.joinedLearners = data,
      error: (err) => console.error('Error fetching learners:', err)
    });
  }

  /* ---------------- Login form ---------------- */
  openLoginForm() { this.isLoginFormOpen = true; }
  closeLoginForm() { this.isLoginFormOpen = false; }

  submitLogin() {
    // Login is not connected yet, so this only closes the form
    this.loginPassword = '';
    this.isLoginFormOpen = false;
  }

  /* ---------------- Contact form ---------------- */
  openContactForm() { this.isContactFormOpen = true; }
  closeContactForm() { this.isContactFormOpen = false; }

  sendWhatsappMessage() {
    if (!this.whatsappNumber || !this.whatsappMessage) {
      alert('Please fill all fields.');
      return;
    }

    const payload = {
      whatsappNumber: this.whatsappNumber,
      message: this.whatsappMessage
    };

    this.learnerApiService.sendContactWhatsapp(payload).subscribe({
      next: () => {
        alert('Thank you! We will contact you shortly on WhatsApp.');
        this.whatsappNumber = '';
        this.whatsappMessage = '';
        this.closeContactForm();
      },
      error: (err) => {
        console.error('Failed to send WhatsApp message:', err);
        alert('Failed to send message. Please try again.');
      }
    });
  }

  sendEmailMessage() {
    if (!this.emailMessage) {
      alert('Please enter a message.');
      return;
    }

    const payload = {
      email: 'mathebemoseri@gmail.com', // fixed recipient
      message: this.emailMessage
    };

    this.learnerApiService.sendContactEmail(payload).subscribe({
      next: (res: any) => {
        alert(res.message);
        this.emailMessage = '';
        this.closeContactForm();
      },
      error: (err) => {
        console.error('Failed to send message:', err);
        alert('Failed to send message. Please try again.');
      }
    });
  }

  /* ---------------- Navigation ---------------- */
  toggleNavMenu() {
    this.isNavMenuOpen = !this.isNavMenuOpen;
  }

  closeNavMenu() {
    this.isNavMenuOpen = false;
    this.isContactMenuOpen = false;
  }

  // FIXED: the old version looked for #hero, which sits at the bottom of the page
  scrollToHero() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Close the menu, then scroll to a section by its id
  goTo(id: string) {
    this.closeNavMenu();
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  openContactFrom(type: 'whatsapp' | 'email') {
    this.contactFormType = type;
    this.closeNavMenu();
    this.isContactFormOpen = true;
  }

  openTestimonialsFromMenu() {
    this.closeNavMenu();
    this.joinForm.requestTestimonials();
  }
}
