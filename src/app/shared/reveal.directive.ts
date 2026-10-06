// src/app/shared/reveal.directive.ts
import { Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';

/** Add `appReveal` to any element and it fades in once, the first time it scrolls into view. */
@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements OnInit, OnDestroy {
  private io?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit() {
    const node = this.el.nativeElement;
    if (!('IntersectionObserver' in window)) return;   // no support: stay visible
    node.setAttribute('data-reveal', '');
    this.io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.classList.add('in');
        this.io?.disconnect();
      }
    }, { threshold: 0.12 });
    this.io.observe(node);
  }

  ngOnDestroy() { this.io?.disconnect(); }
}