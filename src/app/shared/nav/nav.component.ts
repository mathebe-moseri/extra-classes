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
  currentBg = true;
  selectedMenuItem = '';

  // Form fields
  learnerFirstName = '';
  learnerSurname = '';
  grade = '';
  email = '';
  schoolName = '';
  parentFirstName = '';
  parentSurname = '';

  constructor() {
    document.body.style.backgroundColor = '#9CA3AF';
  }

  // Opens the form popup
  toggleMobileMenu() {
    this.isMobileMenuOpen = true;
  }

  // Close popup manually
  closeForm() {
    this.isMobileMenuOpen = false;
  }

  // Submit form
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

      // Close popup
      this.isMobileMenuOpen = false;

      // Reset fields
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

  // Toggle page background color
  toggleBg() {
    this.currentBg = !this.currentBg;
    document.body.style.backgroundColor = this.currentBg ? '#9CA3AF' : '#00213d';
  }

  selectMenuItem(item: string, delay: number = 100) {
    this.selectedMenuItem = item;
    setTimeout(() => {
      this.isMobileMenuOpen = false;
    }, delay);
  }

  closeMobileMenuWithDelay(delay: number = 500) {
    setTimeout(() => {
      this.isMobileMenuOpen = false;
    }, delay);
  }

  // Only close popup when clicking outside the form or join button
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const clickedElement = event.target as HTMLElement;
    if (
      this.isMobileMenuOpen &&
      !clickedElement.closest('.form-popup') && // container of form
      !clickedElement.closest('.mobile-menu-toggle') // join button
    ) {
      this.isMobileMenuOpen = false;
    }
  }
}
