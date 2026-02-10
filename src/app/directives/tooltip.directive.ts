import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';

/**
 * Styled tooltip directive – React/Radix-like UI:
 * rounded box, dark background, light text, shadow, positioned below trigger.
 * Use: <button [appTooltip]="'Bulk upload images'">...</button>
 */
@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnInit, OnDestroy {
  @Input() appTooltip = '';
  @Input() tooltipSide: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  @Input() tooltipOffset = 4;

  private tooltipEl: HTMLElement | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly delayMs = 0;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    if (!this.appTooltip) return;
    this.renderer.listen(this.el.nativeElement, 'mouseenter', () => this.show());
    this.renderer.listen(this.el.nativeElement, 'mouseleave', () => this.hide());
  }

  private show(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.showTimeout = setTimeout(() => this.createAndShow(), this.delayMs);
  }

  private hide(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.hideTimeout = setTimeout(() => this.removeTooltip(), 80);
  }

  private createAndShow(): void {
    if (!this.appTooltip || this.tooltipEl) return;
    const doc = this.el.nativeElement.ownerDocument;
    this.tooltipEl = doc.createElement('div');
    this.tooltipEl.textContent = this.appTooltip;
    this.tooltipEl.setAttribute('role', 'tooltip');
    Object.assign(this.tooltipEl.style, {
      position: 'fixed',
      zIndex: '9999',
      maxWidth: '280px',
      padding: '6px 12px',
      fontSize: '14px',
      lineHeight: '1.4',
      color: 'rgb(241 245 249)',
      backgroundColor: 'rgb(30 41 59)',
      border: '1px solid rgb(51 65 85)',
      borderRadius: '6px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.15s ease',
    });
    doc.body.appendChild(this.tooltipEl);
    requestAnimationFrame(() => {
      if (this.tooltipEl) {
        this.position();
        this.tooltipEl.style.opacity = '1';
      }
    });
  }

  private position(): void {
    if (!this.tooltipEl) return;
    const trigger = this.el.nativeElement.getBoundingClientRect();
    const tip = this.tooltipEl.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const offset = this.tooltipOffset;

    switch (this.tooltipSide) {
      case 'bottom':
        this.tooltipEl.style.left = `${scrollX + trigger.left + trigger.width / 2 - tip.width / 2}px`;
        this.tooltipEl.style.top = `${scrollY + trigger.bottom + offset}px`;
        break;
      case 'top':
        this.tooltipEl.style.left = `${scrollX + trigger.left + trigger.width / 2 - tip.width / 2}px`;
        this.tooltipEl.style.top = `${scrollY + trigger.top - tip.height - offset}px`;
        break;
      case 'left':
        this.tooltipEl.style.left = `${scrollX + trigger.left - tip.width - offset}px`;
        this.tooltipEl.style.top = `${scrollY + trigger.top + trigger.height / 2 - tip.height / 2}px`;
        break;
      case 'right':
        this.tooltipEl.style.left = `${scrollX + trigger.right + offset}px`;
        this.tooltipEl.style.top = `${scrollY + trigger.top + trigger.height / 2 - tip.height / 2}px`;
        break;
    }
  }

  private removeTooltip(): void {
    if (this.tooltipEl?.parentNode) {
      this.tooltipEl.parentNode.removeChild(this.tooltipEl);
    }
    this.tooltipEl = null;
  }

  ngOnDestroy(): void {
    if (this.showTimeout) clearTimeout(this.showTimeout);
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    this.removeTooltip();
  }
}
