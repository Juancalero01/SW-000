import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiSkeletonComponent } from './ui-skeleton.component';

describe('UiSkeletonComponent', () => {
  let fixture: ComponentFixture<UiSkeletonComponent>;
  let component: UiSkeletonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiSkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create skeleton component', () => {
    expect(component).toBeTruthy();
  });

  it('should render default text variant line', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const skeletonEl = compiled.querySelector('div.animate-pulse');
    expect(skeletonEl).toBeTruthy();
  });

  it('should render multiple items when count input is set', () => {
    fixture.componentRef.setInput('count', 4);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const skeletonElements = compiled.querySelectorAll('div.animate-pulse');
    expect(skeletonElements.length).toBe(4);
  });

  it('should render card variant', () => {
    fixture.componentRef.setInput('variant', 'card');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.p-4.bg-white')).toBeTruthy();
  });

  it('should render table-row variant', () => {
    fixture.componentRef.setInput('variant', 'table-row');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.flex.items-center')).toBeTruthy();
  });
});
