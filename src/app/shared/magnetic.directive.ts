import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

@Directive({
  selector: '[appMagnetic]',
  standalone: true,
})
export class MagneticDirective {
  /** How much the element follows the cursor (0–1). 0.3 = subtle, 0.6 = strong. */
  readonly magneticStrength = input(0.32);

  private readonly el = inject(ElementRef<HTMLElement>);
  private rafId: number | null = null;

  @HostListener('mousemove', ['$event'])
  onMove(e: MouseEvent) {
    const node = this.el.nativeElement;
    const rect = node.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const strength = this.magneticStrength();
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      node.style.transform = `translate(${dx}px, ${dy}px)`;
      this.rafId = null;
    });
  }

  @HostListener('mouseleave')
  onLeave() {
    const node = this.el.nativeElement;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      node.style.transform = '';
      this.rafId = null;
    });
  }
}
