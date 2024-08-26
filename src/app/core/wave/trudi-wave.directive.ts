import {
  Directive,
  ElementRef,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
  PLATFORM_ID
} from '@angular/core';
import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';

import { TrudiSafeAny } from '@core';

import { TrudiWaveRenderer } from './trudi-wave-renderer';

export interface TrudiWaveConfig {
  disabled?: boolean;
}

export const TRUDI_WAVE_GLOBAL_DEFAULT_CONFIG: TrudiWaveConfig = {
  disabled: false
};

export const TRUDI_WAVE_GLOBAL_CONFIG = new InjectionToken<TrudiWaveConfig>(
  'trudi-wave-global-options',
  {
    providedIn: 'root',
    factory: TRUDI_WAVE_GLOBAL_CONFIG_FACTORY
  }
);

export function TRUDI_WAVE_GLOBAL_CONFIG_FACTORY(): TrudiWaveConfig {
  return TRUDI_WAVE_GLOBAL_DEFAULT_CONFIG;
}

@Directive({
  selector:
    '[trudi-wave],button[trudi-button]:not([trudiType="link"]):not([trudiType="text"])',
  exportAs: 'trudiWave'
})
export class TrudiWaveDirective implements OnInit, OnDestroy {
  @Input() trudiWaveExtraNode = false;

  private waveRenderer?: TrudiWaveRenderer;
  private waveDisabled: boolean = false;

  get disabled(): boolean {
    return this.waveDisabled;
  }

  get rendererRef(): TrudiWaveRenderer | undefined {
    return this.waveRenderer;
  }

  constructor(
    private ngZone: NgZone,
    private elementRef: ElementRef,
    @Optional()
    @Inject(TRUDI_WAVE_GLOBAL_CONFIG)
    private config: TrudiWaveConfig,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) private animationType: string,
    @Inject(PLATFORM_ID) private platformId: TrudiSafeAny
  ) {
    this.waveDisabled = this.isConfigDisabled();
  }

  isConfigDisabled(): boolean {
    let disabled = false;
    if (this.config && typeof this.config.disabled === 'boolean') {
      disabled = this.config.disabled;
    }
    if (this.animationType === 'NoopAnimations') {
      disabled = true;
    }
    return disabled;
  }

  ngOnDestroy(): void {
    if (this.waveRenderer) {
      this.waveRenderer.destroy();
    }
  }

  ngOnInit(): void {
    this.renderWaveIfEnabled();
  }

  renderWaveIfEnabled(): void {
    if (!this.waveDisabled && this.elementRef.nativeElement) {
      this.waveRenderer = new TrudiWaveRenderer(
        this.elementRef.nativeElement,
        this.ngZone,
        this.trudiWaveExtraNode,
        this.platformId
      );
    }
  }

  disable(): void {
    this.waveDisabled = true;
    if (this.waveRenderer) {
      this.waveRenderer.removeTriggerEvent();
      this.waveRenderer.removeStyleAndExtraNode();
    }
  }

  enable(): void {
    // config priority
    this.waveDisabled = this.isConfigDisabled() || false;
    if (this.waveRenderer) {
      this.waveRenderer.bindTriggerEvent();
    }
  }
}
