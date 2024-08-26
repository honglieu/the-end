import { SimpleChange } from '@angular/core';
import { Observable } from 'rxjs';

export interface InputObservable {
  getInputObservable<K extends keyof this>(
    changeType: K
  ): Observable<SimpleChange>;
}
