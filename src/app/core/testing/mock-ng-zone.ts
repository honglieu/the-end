import { EventEmitter, Injectable, NgZone } from '@angular/core';

import { TrudiSafeAny } from '@core';

/**
 * Mock synchronous NgZone implementation that can be used
 * to flush out `onStable` subscriptions in tests.
 *
 * via: https://github.com/angular/angular/blob/master/packages/core/testing/src/ng_zone_mock.ts
 *
 * @docs-private
 */
@Injectable()
export class MockNgZone extends NgZone {
  override onStable: EventEmitter<TrudiSafeAny> = new EventEmitter(false);

  constructor() {
    super({ enableLongStackTrace: false });
  }

  override run(fn: Function): TrudiSafeAny {
    return fn();
  }

  override runOutsideAngular(fn: Function): TrudiSafeAny {
    return fn();
  }

  simulateZoneExit(): void {
    this.onStable.emit(null);
  }
}
