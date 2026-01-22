import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { LearnerAPiService } from '../../learner-api.service';
import { HttpClientModule } from '@angular/common/http';
import { tap } from 'rxjs/operators';


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

  constructor(private learnerApiService: LearnerAPiService) {
    document.body.style.backgroundColor = '#9CA3AF';
  }

  ngOnInit() {
    this. learnerApiService.getLearnerInfo()
      .pipe(
        tap(data => {
          this.joinedLearners = data;
          // console.log('Fetched learner info:', data);
        })
      )
      .subscribe();



       this.loadLearners()
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
        alert('Welcome to Sesi Mathebe Extra Classes! Your registration was successful. Please check your spam email for further details.');
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

  // --- Contact form ---
  openContactForm() { this.isContactFormOpen = true; }
  closeContactForm() { this.isContactFormOpen = false; }

sendWhatsappMessage() {
  if (this.whatsappMessage) {
    const phone = '27765956598'; // your WhatsApp number (South Africa format, no +)
    const text = encodeURIComponent(this.whatsappMessage);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank'); // opens WhatsApp web or app
    this.closeContactForm();
    this.whatsappMessage = '';
  }
}


sendEmailMessage() {
  if (this.emailAddress && this.emailMessage) {
    const to = 'mathebemoseri@gmail.com'; // your email
    const subject = encodeURIComponent('Contact Form Message');
    const body = encodeURIComponent(`From: ${this.emailAddress}\n\n${this.emailMessage}`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`; // opens email client
    this.closeContactForm();
    this.emailAddress = '';
    this.emailMessage = '';
  }
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

  // --- Click outside to close ---
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const clickedElement = event.target as HTMLElement;

    // Join form
    if (
      this.isMobileMenuOpen &&
      !clickedElement.closest('.form-popup') &&
      !clickedElement.closest('.mobile-menu-toggle')
    ) {
      this.isMobileMenuOpen = false;
    }

    // Contact form
    if (
      this.isContactFormOpen &&
      !clickedElement.closest('.contact-form-popup') &&
      !clickedElement.closest('.contact-toggle')
    ) {
      this.isContactFormOpen = false;
    }
  }
}
