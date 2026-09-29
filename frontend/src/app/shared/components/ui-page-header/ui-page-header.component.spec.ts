import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiPageHeaderComponent } from './ui-page-header.component';

describe('UiPageHeaderComponent', () => {
  let fixture: ComponentFixture<UiPageHeaderComponent>;
  let component: UiPageHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiPageHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiPageHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Gestión de Clientes');
    fixture.detectChanges();
  });

  it('should create page header component and render title', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Gestión de Clientes');
  });

  it('should render subtitle when provided', () => {
    fixture.componentRef.setInput('subtitle', 'Administración de la cartera comercial');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Administración de la cartera comercial');
  });

  it('should toggle filter popover when filter button is clicked', () => {
    expect(component.isFilterOpen()).toBe(false);

    const filterBtn = fixture.nativeElement.querySelector('button');
    filterBtn.click();
    fixture.detectChanges();

    expect(component.isFilterOpen()).toBe(true);

    component.closeFilterPopover();
    expect(component.isFilterOpen()).toBe(false);
  });

  it('should render active filter badge when activeFilterCount > 0', () => {
    fixture.componentRef.setInput('activeFilterCount', 3);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('3');
  });
});
