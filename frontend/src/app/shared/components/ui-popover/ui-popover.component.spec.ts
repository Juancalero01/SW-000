import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { UiPopoverComponent, UiPopoverPlacement } from './ui-popover.component';

@Component({
  standalone: true,
  imports: [UiPopoverComponent],
  template: `
    <div class="relative">
      <app-ui-popover
        [isOpen]="isOpen()"
        title="Test Popover"
        [placement]="placement()"
        (closed)="onClosed()"
      >
        <p>Popover Content</p>
      </app-ui-popover>
    </div>
  `,
})
class TestHostComponent {
  isOpen = signal<boolean>(false);
  placement = signal<UiPopoverPlacement>('bottom-end');
  closedCalled = false;

  onClosed(): void {
    this.closedCalled = true;
  }
}

describe('UiPopoverComponent', () => {
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

  it('should not render popover when isOpen is false', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Test Popover');
  });

  it('should render popover content when isOpen is true', () => {
    host.isOpen.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Popover');
    expect(compiled.textContent).toContain('Popover Content');
  });

  it('should emit closed output when backdrop or close button is clicked', () => {
    host.isOpen.set(true);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.fixed.inset-0');
    backdrop.click();

    expect(host.closedCalled).toBe(true);
  });
});
