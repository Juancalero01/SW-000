import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthLayoutComponent } from './auth-layout.component';
import { provideRouter } from '@angular/router';

describe('AuthLayoutComponent', () => {
  let fixture: ComponentFixture<AuthLayoutComponent>;
  let component: AuthLayoutComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create auth layout component', () => {
    expect(component).toBeTruthy();
  });

  it('should render platform title and router outlet container', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('SW-000 Platform');
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
