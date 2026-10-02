import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  private readonly translate = inject(TranslateService, { optional: true });
  private readonly primeng = inject(PrimeNG, { optional: true });

  ngOnInit(): void {
    if (!this.translate || !this.primeng) {
      return;
    }

    this.translate.setFallbackLang('es');
    this.translate.use('es');

    this.translate.onLangChange.subscribe((event) => {
      const translations = event.translations as any;
      const locale = translations?.['es'] || translations?.['primeng'] || translations;
      if (locale && this.primeng) {
        this.primeng.setTranslation(locale);
      }
    });

    this.translate.get('es').subscribe((res) => {
      if (res && typeof res === 'object' && this.primeng) {
        this.primeng.setTranslation(res as any);
      }
    });
  }
}
