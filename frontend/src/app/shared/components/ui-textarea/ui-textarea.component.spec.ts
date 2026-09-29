import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiTextareaComponent } from './ui-textarea.component';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [UiTextareaComponent, ReactiveFormsModule],
  template: `
    <app-ui-textarea
      [formControl]="control"
      label="Description"
      placeholder="Enter details..."
      [error]="error()"
    />
  `,
})
class TestHostComponent {
  control = new FormControl('Initial text');
  error = signal<string | null>(null);
}

describe('UiTextareaComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display initial form control value', () => {
    const textareaEl: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(textareaEl).toBeTruthy();
    expect(textareaEl.value).toBe('Initial text');
  });

  it('should render label and placeholder correctly', () => {
    const labelEl: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    const textareaEl: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');

    expect(labelEl.textContent?.trim()).toContain('Description');
    expect(textareaEl.placeholder).toBe('Enter details...');
  });

  it('should update form control value on input event', () => {
    const textareaEl: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    textareaEl.value = 'New description text';
    textareaEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(hostComponent.control.value).toBe('New description text');
  });

  it('should render error message when error input is provided', () => {
    hostComponent.error.set('Field is required');
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('p.text-rose-600');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent?.trim()).toBe('Field is required');
  });
});
