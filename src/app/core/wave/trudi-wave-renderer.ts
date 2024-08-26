import { Platform } from '@angular/cdk/platform';
import { NgZone } from '@angular/core';

import { TrudiSafeAny } from '@core';

export class TrudiWaveRenderer {
  private waveTransitionDuration = 400;
  private styleForPseudo: HTMLStyleElement | null = null;
  private extraNode: HTMLDivElement | null = null;
  private lastTime = 0;
  private platform!: Platform;
  clickHandler: (event: MouseEvent) => void;
  get waveAttributeName(): string {
    return this.insertExtraNode
      ? 'trudi-click-animating'
      : 'trudi-click-animating-without-extra-node';
  }

  constructor(
    private triggerElement: HTMLElement,
    private ngZone: NgZone,
    private insertExtraNode: boolean,
    private platformId: TrudiSafeAny
  ) {
    this.platform = new Platform(this.platformId);
    this.clickHandler = this.onClick.bind(this);
    this.bindTriggerEvent();
  }

  onClick = (event: MouseEvent): void => {
    if (
      !this.triggerElement ||
      !this.triggerElement.getAttribute ||
      this.triggerElement.getAttribute('disabled') ||
      (event.target as HTMLElement).tagName === 'INPUT' ||
      this.triggerElement.className.indexOf('disabled') >= 0
    ) {
      return;
    }
    this.fadeOutWave();
  };

  bindTriggerEvent(): void {
    if (this.platform.isBrowser) {
      this.ngZone.runOutsideAngular(() => {
        this.removeTriggerEvent();
        if (this.triggerElement) {
          this.triggerElement.addEventListener(
            'click',
            this.clickHandler,
            true
          );
        }
      });
    }
  }

  removeTriggerEvent(): void {
    if (this.triggerElement) {
      this.triggerElement.removeEventListener('click', this.clickHandler, true);
    }
  }

  removeStyleAndExtraNode(): void {
    if (this.styleForPseudo && document.body.contains(this.styleForPseudo)) {
      document.body.removeChild(this.styleForPseudo);
      this.styleForPseudo = null;
    }
    if (this.insertExtraNode && this.triggerElement.contains(this.extraNode)) {
      this.triggerElement.removeChild(this.extraNode as Node);
    }
  }

  destroy(): void {
    this.removeTriggerEvent();
    this.removeStyleAndExtraNode();
  }

  private fadeOutWave(): void {
    const node = this.triggerElement;
    const waveColor = this.getWaveColor(node);
    node.setAttribute(this.waveAttributeName, 'true');
    if (Date.now() < this.lastTime + this.waveTransitionDuration) {
      return;
    }

    if (this.isValidColor(waveColor)) {
      if (!this.styleForPseudo) {
        this.styleForPseudo = document.createElement('style');
      }

      this.styleForPseudo.innerHTML = `
      [trudi-click-animating-without-extra-node='true']::after, .trudi-click-animating-node {
        --antd-wave-shadow-color: ${waveColor};
      }`;
      document.body.appendChild(this.styleForPseudo);
    }

    if (this.insertExtraNode) {
      if (!this.extraNode) {
        this.extraNode = document.createElement('div');
      }
      this.extraNode.className = 'trudi-click-animating-node';
      node.appendChild(this.extraNode);
    }

    this.lastTime = Date.now();

    this.runTimeoutOutsideZone(() => {
      node.removeAttribute(this.waveAttributeName);
      this.removeStyleAndExtraNode();
    }, this.waveTransitionDuration);
  }

  private isValidColor(color: string): boolean {
    return (
      !!color &&
      color !== '#ffffff' &&
      color !== 'rgb(255, 255, 255)' &&
      this.isNotGrey(color) &&
      !/rgba\(\d*, \d*, \d*, 0\)/.test(color) &&
      color !== 'transparent'
    );
  }

  private isNotGrey(color: string): boolean {
    const match = color.match(/rgba?\((\d*), (\d*), (\d*)(, [\.\d]*)?\)/);
    if (match && match[1] && match[2] && match[3]) {
      return !(match[1] === match[2] && match[2] === match[3]);
    }
    return true;
  }

  private getWaveColor(node: HTMLElement): string {
    const nodeStyle = getComputedStyle(node);
    return (
      nodeStyle.getPropertyValue('border-top-color') || // Firefox Compatible
      nodeStyle.getPropertyValue('border-color') ||
      nodeStyle.getPropertyValue('background-color')
    );
  }

  private runTimeoutOutsideZone(fn: () => void, delay: number): void {
    this.ngZone.runOutsideAngular(() => setTimeout(fn, delay));
  }
}
