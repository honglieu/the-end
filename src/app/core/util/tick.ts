import { Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

export function inNextTick(): Observable<void> {
  const timer = new Subject<void>();
  Promise.resolve().then(() => timer.next());
  return timer.pipe(take(1));
}
