import { from, isObservable, Observable, of } from 'rxjs';

import { isPromise } from './is-promise';

export function wrapIntoObservable<T>(
  value: T | Promise<T> | Observable<T>
): Observable<T> {
  if (isObservable(value)) {
    return value;
  }

  if (isPromise(value)) {
    // Use `Promise.resolve()` to wrap promise-like instances.
    return from(Promise.resolve(value));
  }

  return of(value);
}
