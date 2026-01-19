import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Required for ngModel

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent {
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
  parentFirstName = '';
  parentSurname = '';

  // Contact form state
  contactFormType: 'whatsapp' | 'email' = 'whatsapp';
  whatsappNumber = '';
  whatsappMessage = '';
  emailAddress = '';
  emailMessage = '';

  constructor() {
    document.body.style.backgroundColor = '#9CA3AF';
  }

  // --- Join form ---
  toggleMobileMenu() { this.isMobileMenuOpen = true; }
  closeForm() { this.isMobileMenuOpen = false; }

  submitForm() {
    if (
      this.learnerFirstName && this.learnerSurname &&
      this.grade && this.email && this.schoolName &&
      this.parentFirstName && this.parentSurname
    ) {
      console.log('Form submitted', {
        learnerFirstName: this.learnerFirstName,
        learnerSurname: this.learnerSurname,
        grade: this.grade,
        email: this.email,
        schoolName: this.schoolName,
        parentFirstName: this.parentFirstName,
        parentSurname: this.parentSurname
      });

      alert('Form submitted successfully!');
      this.isMobileMenuOpen = false;

      // reset
      this.learnerFirstName = '';
      this.learnerSurname = '';
      this.grade = '';
      this.email = '';
      this.schoolName = '';
      this.parentFirstName = '';
      this.parentSurname = '';
    } else {
      alert('Please fill all fields before submitting.');
    }
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
