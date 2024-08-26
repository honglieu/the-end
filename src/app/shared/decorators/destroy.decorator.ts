import { OnDestroy } from '@angular/core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DestroyDecorator<T extends { new (...args: any[]): OnDestroy }>(
  constructor: T
) {
  const originalNgOnDestroy = constructor.prototype.ngOnDestroy;

  constructor.prototype.ngOnDestroy = function () {
    if (originalNgOnDestroy && typeof originalNgOnDestroy === 'function') {
      originalNgOnDestroy.apply(this, arguments);
    }
    for (const key of Object.keys(this)) {
      if (this.hasOwnProperty(key)) {
        this[key] = null;
      }
    }
  };
}
