import { Injectable } from '@angular/core';

import { environment } from '@core';
import { TrudiSafeAny } from '@core';

interface SingletonRegistryItem {
  target: TrudiSafeAny;
}

/**
 * When running in test, singletons should not be destroyed. So we keep references of singletons
 * in this global variable.
 */
const testSingleRegistry = new Map<string, SingletonRegistryItem>();

/**
 * Some singletons should have life cycle that is same to Angular's. This service make sure that
 * those singletons get destroyed in HMR.
 */
@Injectable({
  providedIn: 'root'
})
export class TrudiSingletonService {
  private get singletonRegistry(): Map<string, SingletonRegistryItem> {
    return environment.isTestMode
      ? testSingleRegistry
      : this._singletonRegistry;
  }

  /**
   * This registry is used to register singleton in dev mode.
   * So that singletons get destroyed when hot module reload happens.
   *
   * This works in prod mode too but with no specific effect.
   */
  private _singletonRegistry = new Map<string, SingletonRegistryItem>();

  registerSingletonWithKey(key: string, target: TrudiSafeAny): void {
    const alreadyHave = this.singletonRegistry.has(key);
    const item: SingletonRegistryItem = alreadyHave
      ? this.singletonRegistry.get(key)!
      : this.withNewTarget(target);

    if (!alreadyHave) {
      this.singletonRegistry.set(key, item);
    }
  }

  getSingletonWithKey<T>(key: string): T | null {
    return this.singletonRegistry.has(key)
      ? (this.singletonRegistry.get(key)!.target as T)
      : null;
  }

  private withNewTarget(target: TrudiSafeAny): SingletonRegistryItem {
    return {
      target
    };
  }
}
