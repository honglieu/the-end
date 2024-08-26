import { Observable, OperatorFunction } from 'rxjs';

export function randomDelay<T>(
  min: number,
  max: number
): OperatorFunction<T, T> {
  return (source: Observable<T>) =>
    new Observable<T>((subscriber) => {
      source.subscribe({
        next(value) {
          const randomTime = Math.random() * (max - min) + min;
          setTimeout(() => {
            subscriber.next(value);
          }, randomTime);
        },
        error(err) {
          subscriber.error(err);
        },
        complete() {
          subscriber.complete();
        }
      });
    });
}
