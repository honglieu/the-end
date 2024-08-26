import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SmsMessageConversationIdSetService {
  private messageConversationIds: Set<string> = new Set();
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
    this.messageConversationIds.add(value);
  }

  has(value: string) {
    return this.messageConversationIds.has(value);
  }

  clear() {
    this.messageConversationIds.clear();
  }

  values() {
    return this.messageConversationIds.values();
  }

  delete(value: string) {
    this.messageConversationIds.delete(value);
  }
}
