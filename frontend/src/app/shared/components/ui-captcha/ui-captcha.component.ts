import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../core/environments/environment';

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        parameters: {
          sitekey: string;
          callback: (response: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaApiLoaded?: () => void;
  }
}

@Component({
  selector: 'app-ui-captcha',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'w-full block',
  },
  template: `
    <div class="flex flex-col items-center justify-center w-full my-1">
      <div #recaptchaWrapper class="w-full flex items-center justify-center overflow-hidden" [style.height.px]="scaledHeight()">
        <div
          #recaptchaContainer
          class="origin-top flex items-center justify-center"
          [style.transform]="scale() < 1 ? 'scale(' + scale() + ')' : null"
          [style.transform-origin]="'top center'"
          style="width: 304px; height: 78px;"
        ></div>
      </div>
      @if (errorText) {
        <p class="text-xs text-rose-600 mt-1.5 font-medium text-center flex items-center justify-center gap-1">
          <svg class="w-3.5 h-3.5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{{ errorText }}</span>
        </p>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
  `,
})
export class UiCaptchaComponent implements AfterViewInit, OnDestroy {
  @ViewChild('recaptchaWrapper', { static: false })
  recaptchaWrapper?: ElementRef<HTMLDivElement>;

  @ViewChild('recaptchaContainer', { static: false })
  recaptchaContainer!: ElementRef<HTMLDivElement>;

  @Input() siteKey: string = environment.recaptchaSiteKey;
  @Input() errorText: string | null = null;

  @Output() resolved = new EventEmitter<string | null>();
  @Output() expired = new EventEmitter<void>();

  readonly scale = signal<number>(1);
  readonly scaledHeight = computed(() => (this.scale() < 1 ? Math.round(78 * this.scale()) : 78));

  private widgetId: number | null = null;
  private isDestroyed = false;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.updateScale();
    this.initResizeObserver();
    this.initRecaptcha();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.resizeObserver?.disconnect();
  }

  private updateScale(): void {
    if (!this.recaptchaWrapper?.nativeElement) return;
    const width = this.recaptchaWrapper.nativeElement.offsetWidth || 0;
    if (width > 0 && width < 304) {
      this.scale.set(width / 304);
    } else {
      this.scale.set(1);
    }
  }

  private initResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined' || !this.recaptchaWrapper?.nativeElement) return;
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0 && width < 304) {
          this.scale.set(width / 304);
        } else {
          this.scale.set(1);
        }
      }
    });
    this.resizeObserver.observe(this.recaptchaWrapper.nativeElement);
  }

  reset(): void {
    if (window.grecaptcha && this.widgetId !== null) {
      try {
        window.grecaptcha.reset(this.widgetId);
      } catch {
        // Safe fallback
      }
    }
    this.resolved.emit(null);
  }

  private initRecaptcha(): void {
    if (typeof window === 'undefined') return;

    if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
      this.renderWidget();
      return;
    }

    // Load Google reCAPTCHA v2 script if not present
    const scriptId = 'google-recaptcha-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      window.onRecaptchaApiLoaded = () => {
        if (!this.isDestroyed) {
          this.renderWidget();
        }
      };

      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaApiLoaded&render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else {
      const existingCallback = window.onRecaptchaApiLoaded;
      window.onRecaptchaApiLoaded = () => {
        if (existingCallback) existingCallback();
        if (!this.isDestroyed) {
          this.renderWidget();
        }
      };
    }
  }

  private renderWidget(): void {
    if (
      !this.recaptchaContainer ||
      !window.grecaptcha ||
      typeof window.grecaptcha.render !== 'function' ||
      this.widgetId !== null
    ) {
      return;
    }

    try {
      this.widgetId = window.grecaptcha.render(this.recaptchaContainer.nativeElement, {
        sitekey: this.siteKey,
        callback: (response: string) => {
          this.resolved.emit(response);
        },
        'expired-callback': () => {
          this.resolved.emit(null);
          this.expired.emit();
        },
        'error-callback': () => {
          this.resolved.emit(null);
        },
      });
    } catch {
      // Element might already be rendered or unavailable
    }
  }
}
