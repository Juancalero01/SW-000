import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiCaptchaComponent } from './ui-captcha.component';

describe('UiCaptchaComponent', () => {
  let component: UiCaptchaComponent;
  let fixture: ComponentFixture<UiCaptchaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiCaptchaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiCaptchaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create UiCaptchaComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should emit null on reset()', () => {
    const spy = vi.spyOn(component.resolved, 'emit');
    component.reset();
    expect(spy).toHaveBeenCalledWith(null);
  });
});
