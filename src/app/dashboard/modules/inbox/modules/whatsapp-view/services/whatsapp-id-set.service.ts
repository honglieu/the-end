import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WhatsappIdSetService {
  private messageIds: Set<string> = new Set();

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
