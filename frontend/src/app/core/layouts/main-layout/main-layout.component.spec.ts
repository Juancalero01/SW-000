import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainLayoutComponent } from './main-layout.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { signal } from '@angular/core';

describe('MainLayoutComponent', () => {
  let fixture: ComponentFixture<MainLayoutComponent>;
  let component: MainLayoutComponent;

  beforeEach(async () => {
    const mockAuthService = {
      currentUser: signal({
        id: 1,
        email: 'admin@test.com',
        fullName: 'Admin User',
        isActive: true,
        roles: [{ id: 1, name: 'Admin' }],
      }),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create main layout component', () => {
    expect(component).toBeTruthy();
  });

  it('should render sidebar, toast container, and router outlet without header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-sidebar')).toBeTruthy();
    expect(compiled.querySelector('app-header')).toBeNull();
    expect(compiled.querySelector('app-toast-container')).toBeTruthy();
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should toggle sidebar state when toggleSidebar is called', () => {
    expect(component.sidebarOpen()).toBe(false);
    component.toggleSidebar();
    expect(component.sidebarOpen()).toBe(true);
    component.closeSidebar();
    expect(component.sidebarOpen()).toBe(false);
  });
});
