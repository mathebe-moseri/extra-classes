import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent {
  isMobileMenuOpen = false;
  currentBg = true;
  selectedMenuItem = '';

  constructor() {
    document.body.style.backgroundColor = '#9CA3AF';
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenuWithDelay(delay: number = 500) {
    setTimeout(() => {
      this.isMobileMenuOpen = false;
    }, delay);
  }

  selectMenuItem(item: string, delay: number = 100) {
    this.selectedMenuItem = item;

    setTimeout(() => {
      this.isMobileMenuOpen = false;
    }, delay);
  }

  toggleBg() {
    this.currentBg = !this.currentBg;

    document.body.style.backgroundColor = this.currentBg
      ? '#9CA3AF'
      : '#00213d';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const clickedElement = event.target as HTMLElement;

    if (
      this.isMobileMenuOpen &&
      !clickedElement.closest('.mobile-menu-container') &&
      !clickedElement.closest('.mobile-menu-toggle')
    ) {
      this.isMobileMenuOpen = false;
    }
  }
}
