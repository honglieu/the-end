import { Inject, Injectable, Optional } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, mapTo } from 'rxjs/operators';

import { TrudiSafeAny } from '@core';

import { TrudiConfig, TrudiConfigKey, TRUDI_CONFIG } from './config';

const isDefined = function (value?: TrudiSafeAny): boolean {
  return value !== undefined;
};

const defaultPrefixCls = 'ant';

@Injectable({
  providedIn: 'root'
})
export class TrudiConfigService {
  private configUpdated$ = new Subject<keyof TrudiConfig>();

  /** Global config holding property. */
  private readonly config: TrudiConfig;

  constructor(@Optional() @Inject(TRUDI_CONFIG) defaultConfig?: TrudiConfig) {
    this.config = defaultConfig || {};
    if (this.config.theme) {
      // If theme is set with TRUDI_CONFIG, register theme to make sure css variables work
      // registerTheme(this.getConfig().prefixCls?.prefixCls || defaultPrefixCls, this.config.theme);
    }
  }

  getConfig(): TrudiConfig {
    return this.config;
  }

  getConfigForComponent<T extends TrudiConfigKey>(
    componentName: T
  ): TrudiConfig[T] {
    return this.config[componentName];
  }

  getConfigChangeEventForComponent(
    componentName: TrudiConfigKey
  ): Observable<void> {
    return this.configUpdated$.pipe(
      filter((n) => n === componentName),
      mapTo(undefined)
    );
  }

  set<T extends TrudiConfigKey>(componentName: T, value: TrudiConfig[T]): void {
    this.config[componentName] = { ...this.config[componentName], ...value };
    if (componentName === 'theme' && this.config.theme) {
      // registerTheme(this.getConfig().prefixCls?.prefixCls || defaultPrefixCls, this.config.theme);
    }
    this.configUpdated$.next(componentName);
  }
}

/* eslint-disable no-invalid-this */

/**
 * This decorator is used to decorate properties. If a property is decorated, it would try to load default value from
 * config.
 */
// eslint-disable-next-line
export function WithConfig<T>() {
  return function ConfigDecorator(
    target: TrudiSafeAny,
    propName: TrudiSafeAny,
    originalDescriptor?: TypedPropertyDescriptor<T>
  ): TrudiSafeAny {
    const privatePropName = `$$__zorroConfigDecorator__${propName}`;

    Object.defineProperty(target, privatePropName, {
      configurable: true,
      writable: true,
      enumerable: false
    });

    return {
      get(): T | undefined {
        const originalValue = originalDescriptor?.get
          ? originalDescriptor.get.bind(this)()
          : this[privatePropName];
        const assignedByUser =
          (this.propertyAssignCounter?.[propName] || 0) > 1;
        const configValue = this.trudiConfigService?.getConfigForComponent(
          this._trudiModuleName
        )?.[propName];
        if (assignedByUser && isDefined(originalValue)) {
          return originalValue;
        } else {
          return isDefined(configValue) ? configValue : originalValue;
        }
      },
      set(value?: T): void {
        // If the value is assigned, we consider the newly assigned value as 'assigned by user'.
        this.propertyAssignCounter = this.propertyAssignCounter || {};
        this.propertyAssignCounter[propName] =
          (this.propertyAssignCounter[propName] || 0) + 1;

        if (originalDescriptor?.set) {
          originalDescriptor.set.bind(this)(value!);
        } else {
          this[privatePropName] = value;
        }
      },
      configurable: true,
      enumerable: true
    };
  };
}
