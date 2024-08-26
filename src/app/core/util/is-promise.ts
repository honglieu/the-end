import { TrudiSafeAny } from '@core';

export function isPromise<T>(obj: TrudiSafeAny): obj is Promise<T> {
  return (
    !!obj && typeof obj.then === 'function' && typeof obj.catch === 'function'
  );
}
