import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';
import { EventEmitter } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

describe('App', () => {
  it('should create the app without optional translation providers', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render router outlet', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should configure TranslateService and apply translations to PrimeNG on init and langChange', async () => {
    const onLangChangeEmitter = new EventEmitter<LangChangeEvent>();
    const mockTranslateService = {
      setFallbackLang: vi.fn(),
      use: vi.fn().mockReturnValue(of({ es: { apply: 'Aplicar', clear: 'Limpiar' } })),
      onLangChange: onLangChangeEmitter,
      get: vi.fn().mockReturnValue(of({ apply: 'Aplicar', clear: 'Limpiar' })),
    };
    const mockPrimeNG = {
      setTranslation: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: PrimeNG, useValue: mockPrimeNG },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(mockTranslateService.setFallbackLang).toHaveBeenCalledWith('es');
    expect(mockTranslateService.use).toHaveBeenCalledWith('es');
    expect(mockPrimeNG.setTranslation).toHaveBeenCalledWith({ apply: 'Aplicar', clear: 'Limpiar' });

    // Test onLangChange emission
    onLangChangeEmitter.emit({
      lang: 'es',
      translations: {
        es: {
          apply: 'Aplicar 2',
          clear: 'Limpiar 2',
        },
      },
    });

    expect(mockPrimeNG.setTranslation).toHaveBeenCalledWith({ apply: 'Aplicar 2', clear: 'Limpiar 2' });
  });
});
