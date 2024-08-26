import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageIdSetService {
  private messageIds: Set<string> = new Set();
  private isMessageIdsEmpty: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );

  public get isMessageIdsEmpty$() {
    return this.isMessageIdsEmpty.asObservable();
  }

  setIsMessageIdsEmpty(value: boolean) {
    this.isMessageIdsEmpty.next(value);
  }

  insert(value: string) {
    this.messageIds.add(value);
  }

  has(value: string) {
    return this.messageIds.has(value);
  }

  clear() {
    this.messageIds.clear();
  }

  values() {
    return this.messageIds.values();
  }

  delete(value: string) {
    this.messageIds.delete(value);
  }
}
