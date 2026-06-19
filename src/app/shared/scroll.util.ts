export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function scrollToAnchor(href: string): void {
  document.querySelector(href)?.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start'
  });
}
