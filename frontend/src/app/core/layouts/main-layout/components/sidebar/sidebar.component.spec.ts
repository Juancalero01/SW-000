import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { AbilityService } from '../../../../services/ability.service';
import { signal } from '@angular/core';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      currentUser: signal({ id: 1, email: 'admin@sw000.com', fullName: 'Juan Calero', roles: [{ name: 'Admin' }] }),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        AbilityService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create sidebar component', () => {
    expect(component).toBeTruthy();
  });

  it('should render all navigation items for Admin user', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('a');
    expect(navLinks.length).toBe(5);
    expect(compiled.textContent).toContain('Dashboard');
    expect(compiled.textContent).toContain('Usuarios');
    expect(compiled.textContent).toContain('Roles y Permisos');
    expect(compiled.textContent).toContain('Flujos de Trabajo');
    expect(compiled.textContent).toContain('Auditoría');
  });

  it('should filter navigation items for standard user based on permissions', () => {
    mockAuthService.currentUser.set({
      id: 2,
      email: 'user@sw000.com',
      fullName: 'Standard User',
      roles: [{ name: 'USER' }],
      permissions: [{ id: 10, action: 'read', subject: 'User' }],
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('a');
    // Standard user has access to Dashboard (default) and User
    expect(navLinks.length).toBe(2);
    expect(compiled.textContent).toContain('Dashboard');
    expect(compiled.textContent).toContain('Usuarios');
    expect(compiled.textContent).not.toContain('Auditoría');
  });

  it('should display user initials and handle logout', () => {
    const initials = component.getUserInitials('Juan Calero');
    expect(initials).toBe('JC');

    component.onLogout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should emit closeSidebar when mobile backdrop is clicked', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    let emitted = false;
    component.closeSidebar.subscribe(() => {
      emitted = true;
    });

    const backdrop = fixture.nativeElement.querySelector('div.fixed.inset-0');
    backdrop.click();
    expect(emitted).toBe(true);
  });
});
