export function scrollToAnchor(href: string): void {
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
