import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { UiBadgeComponent, UiBadgeVariant, UiBadgeSize } from './ui-badge.component';

@Component({
  standalone: true,
  imports: [UiBadgeComponent],
  template: `
    <app-ui-badge
      [variant]="variant()"
      [size]="size()"
      [dot]="dot()"
      [uppercase]="uppercase()"
    >
      {{ badgeText() }}
    </app-ui-badge>
  `,
})
class TestHostComponent {
  variant = signal<UiBadgeVariant>('default');
  size = signal<UiBadgeSize>('sm');
  dot = signal<boolean>(false);
  uppercase = signal<boolean>(false);
  badgeText = signal<string>('Activo');
}

describe('UiBadgeComponent', () => {
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

  it('should render badge with default styling and content', () => {
    const badgeEl = fixture.nativeElement.querySelector('app-ui-badge span');
    expect(badgeEl).toBeTruthy();
    expect(badgeEl.textContent.trim()).toBe('Activo');
  });

  it('should apply success variant and dot indicator when configured', () => {
    host.variant.set('success');
    host.dot.set(true);
    fixture.detectChanges();

    const dotEl = fixture.nativeElement.querySelector('app-ui-badge span span');
    expect(dotEl).toBeTruthy();
    expect(dotEl.classList.contains('bg-emerald-500')).toBe(true);
  });

  it('should apply dark variant and uppercase transformation', () => {
    host.variant.set('dark');
    host.uppercase.set(true);
    fixture.detectChanges();

    const badgeEl = fixture.nativeElement.querySelector('app-ui-badge span');
    expect(badgeEl.classList.contains('uppercase')).toBe(true);
    expect(badgeEl.classList.contains('bg-zinc-900')).toBe(true);
  });
});
