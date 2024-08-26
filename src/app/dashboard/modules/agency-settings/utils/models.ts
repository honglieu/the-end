import { BehaviorSubject, Observable } from 'rxjs';

export class ObservableState<T> {
  private _subject: BehaviorSubject<T>;

  constructor(initialValue: T) {
    this._subject = new BehaviorSubject<T>(initialValue);
  }

  get value(): T {
    return this._subject.getValue();
  }

  set value(newValue: T) {
    this._subject.next(newValue);
  }

  get valueChanges(): Observable<T> {
    return this._subject.asObservable();
  }
}
