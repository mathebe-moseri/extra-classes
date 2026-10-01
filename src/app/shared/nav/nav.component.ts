import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { LearnerAPiService } from '../../learner-api.service';
import { HttpClientModule } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { JoinFormService } from '../../join-form.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [LearnerAPiService],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent {

  //learner info from API
  joinedLearners: any = [];
  // Navbar state
  isMobileMenuOpen = false;
  isContactFormOpen = false;
  currentBg = true;
  selectedMenuItem = '';

  // Join form fields
  learnerFirstName = '';
  learnerSurname = '';
  grade = '';
  email = '';
  schoolName = '';
  parentFullName = '';
  parentCell = '';

  // Contact form state
  contactFormType: 'whatsapp' | 'email' = 'whatsapp';
  whatsappNumber = '';
  whatsappMessage = '';
  emailAddress = '';
  emailMessage = '';

  isNavMenuOpen = false;

  // Login form state
  isLoginFormOpen = false;
  loginEmail = '';
  loginPassword = '';

  constructor(
    private learnerApiService: LearnerAPiService,
    private http: HttpClient,
    private joinForm: JoinFormService
  ) {
    document.body.style.backgroundColor = '#9CA3AF';
  }

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
      .pipe(
        tap(data => {
          this.joinedLearners = data;
          // console.log('Fetched learner info:', data);
        })
      )
      .subscribe();

    this.loadLearners();
  }

  // --- Join form ---
  toggleMobileMenu() { this.isMobileMenuOpen = true; }
  closeForm() { this.isMobileMenuOpen = false; }

  submitForm() {
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
        ParentCell: this.parentCell // match backend property
      };

      this.learnerApiService.addLearner(learnerData).subscribe({
        next: () => {
          alert('Welcome to Sesi Mathebe Extra Classes! Your registration was successful. Please check your email for further details.');
          this.isMobileMenuOpen = false;

          // Reset fields
          this.learnerFirstName = '';
          this.learnerSurname = '';
          this.grade = '';
          this.email = '';
          this.schoolName = '';
          this.parentFullName = '';
          this.parentCell = '';

          // Optionally refresh list
          this.loadLearners();
        },
        error: (err) => {
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

  // --- Login form ---
  openLoginForm() { this.isLoginFormOpen = true; }
  closeLoginForm() { this.isLoginFormOpen = false; }

  submitLogin() {
    // Login is not connected yet, so this only closes the form
    this.loginPassword = '';
    this.isLoginFormOpen = false;
  }

  // --- Contact form ---
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
        alert(res.message);  // success alert
        this.emailMessage = '';
        this.closeContactForm();
      },
      error: (err) => {
        console.error('Failed to send message:', err);
        alert('Failed to send message. Please try again.');
      }
    });
  }

  // --- Navbar toggle ---
  toggleBg() {
    this.currentBg = !this.currentBg;
    document.body.style.backgroundColor = this.currentBg ? '#9CA3AF' : '#00213d';
  }

  selectMenuItem(item: string, delay: number = 100) {
    this.selectedMenuItem = item;
    setTimeout(() => this.isMobileMenuOpen = false, delay);
  }

  closeMobileMenuWithDelay(delay: number = 500) {
    setTimeout(() => this.isMobileMenuOpen = false, delay);
  }

  scrollToAbout() {
    const el = document.getElementById('about-us');
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

    scrollToApply() {
    const el = document.getElementById('how-to-apply');
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  toggleNavMenu() {
    this.isNavMenuOpen = !this.isNavMenuOpen;
  }

  closeNavMenu() {
    this.isNavMenuOpen = false;
  }

  selectedMenu: string = '';

  selectMenu(menuId: string) {
    this.selectedMenu = menuId;
    this.closeNavMenu(); // optional if you want menu to close on click
  }

  scrollToHero() {
    const hero = document.getElementById('hero');
    if (hero) {
      // Adjust for fixed header height (e.g., 60px)
      const offset = 60;
      const top = hero.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({
        top,
        behavior: 'smooth'
      });
    }
  }

}