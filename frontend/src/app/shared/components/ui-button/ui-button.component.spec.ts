import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { UiButtonComponent } from './ui-button.component';

@Component({
  standalone: true,
  imports: [UiButtonComponent],
  template: `
    <app-ui-button [variant]="variant()" [loading]="loading()" (btnClick)="onClick()">
      Guardar
    </app-ui-button>
  `,
})
class TestHostComponent {
  variant = signal<'primary' | 'secondary' | 'danger'>('primary');
  loading = signal<boolean>(false);
  clicked = false;

  onClick(): void {
    this.clicked = true;
  }
}

describe('UiButtonComponent', () => {
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

  it('should render button text and handle clicks', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Guardar');

    const button = compiled.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(host.clicked).toBe(true);
  });

  it('should disable button when loading', () => {
    host.loading.set(true);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
