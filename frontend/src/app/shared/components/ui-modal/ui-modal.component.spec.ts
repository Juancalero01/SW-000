import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { UiModalComponent, UiModalSide, UiModalSize, UiModalVariant } from './ui-modal.component';

@Component({
  standalone: true,
  imports: [UiModalComponent],
  template: `
    <app-ui-modal
      [isOpen]="isOpen()"
      [variant]="variant()"
      [side]="side()"
      [size]="size()"
      [blocking]="blocking()"
      [closeOnBackdrop]="closeOnBackdrop()"
      title="Test Modal"
      subtitle="Modal Subtitle"
      (closed)="onClosed()"
    >
      <p>Modal Content</p>
    </app-ui-modal>
  `,
})
class TestHostComponent {
  isOpen = signal<boolean>(false);
  variant = signal<UiModalVariant>('slide-over');
  side = signal<UiModalSide>('right');
  size = signal<UiModalSize>('md');
  blocking = signal<boolean>(false);
  closeOnBackdrop = signal<boolean>(true);
  closedCalled = false;

  onClosed(): void {
    this.closedCalled = true;
  }
}

describe('UiModalComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not render panel when isOpen is false', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Test Modal');
  });

  it('should render slide-over drawer when isOpen is true and variant is slide-over', () => {
    host.isOpen.set(true);
    host.variant.set('slide-over');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Modal');
    expect(compiled.textContent).toContain('Modal Subtitle');
    expect(compiled.textContent).toContain('Modal Content');

    const backdrop = compiled.querySelector('.fixed.inset-0');
    expect(backdrop?.classList.contains('justify-end')).toBe(true);
  });

  it('should render slide-over drawer on left side when side is left', () => {
    host.isOpen.set(true);
    host.variant.set('slide-over');
    host.side.set('left');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const backdrop = compiled.querySelector('.fixed.inset-0');
    expect(backdrop?.classList.contains('justify-start')).toBe(true);
  });

  it('should render centered dialog when variant is centered', () => {
    host.isOpen.set(true);
    host.variant.set('centered');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const backdrop = compiled.querySelector('.fixed.inset-0');
    expect(backdrop?.classList.contains('justify-center')).toBe(true);
  });

  it('should apply size half correctly in slide-over variant', () => {
    host.isOpen.set(true);
    host.variant.set('slide-over');
    host.size.set('half');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const panel = compiled.querySelector('.fixed.inset-0 > div');
    expect(panel?.classList.contains('sm:w-1/2')).toBe(true);
  });

  it('should hide close button X when blocking is true', () => {
    host.isOpen.set(true);
    host.blocking.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const closeBtn = compiled.querySelector('button[aria-label="Cerrar dialogo"]');
    expect(closeBtn).toBeNull();
  });
});
