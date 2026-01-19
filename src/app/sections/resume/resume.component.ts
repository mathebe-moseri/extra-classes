import { Component } from '@angular/core';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-resume',
  standalone: true,
  imports: [SafeHtmlPipe],
  templateUrl: './resume.component.html',
  styleUrl: './resume.component.css'
})
export class ResumeComponent {

  whatsappIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="text-green-600">  <path d="M20.52 3.48A11.8 11.8 0 0 0 12.04 0C5.44 0 .1 5.33.1 11.9c0 2.1.55 4.15 1.6 5.95L0 24l6.3-1.65a12.1 12.1 0 0 0 5.73 1.46h.01c6.61 0 12.04-5.33 12.04-11.9 0-3.18-1.27-6.17-3.56-8.43zM12.04 21.3a10.1 10.1 0 0 1-5.15-1.42l-.37-.22-3.73.98 1-3.64-.24-.37a9.77 9.77 0 0 1-1.48-5.15c0-5.44 4.44-9.86 9.97-9.86 2.66 0 5.16 1.04 7.04 2.9a9.73 9.73 0 0 1 2.93 7.03c0 5.46-4.44 9.9-9.97 9.9zm5.85-7.37c-.32-.16-1.9-.94-2.2-1.05-.29-.1-.5-.16-.72.16-.21.31-.83 1.06-1.02 1.28-.19.21-.38.23-.7.08-.32-.16-1.37-.5-2.61-1.59a9.6 9.6 0 0 1-1.78-2.2c-.19-.32-.02-.49.14-.64.14-.14.31-.38.47-.57.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.07-.16-.72-1.73-.99-2.37-.26-.63-.53-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.31-1.12 1.1-1.12 2.68 0 1.58 1.15 3.1 1.31 3.32.16.21 2.26 3.45 5.48 4.83.77.33 1.37.52 1.83.66.77.24 1.47.21 2.02.13.62-.09 1.9-.78 2.17-1.53.27-.74.27-1.38.19-1.53-.08-.16-.29-.24-.61-.4z"/></svg>`;
  mapPinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  mailIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"/><polyline points="3,5 12,13 21,5"/></svg>`;
  githubIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`;
  linkedinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`;
  portfolioIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/></svg>`;

  printCV() {
    window.print();
  }
}
