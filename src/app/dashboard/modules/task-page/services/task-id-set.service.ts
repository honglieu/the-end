import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TaskIdSetService {
  private taskIds: Set<string> = new Set();

  constructor() {}

  insert(value: string) {
    this.taskIds.add(value);
  }

  has(value: string) {
    return this.taskIds.has(value);
  }

  clear() {
    this.taskIds.clear();
  }

  values() {
    return this.taskIds.values();
  }

  delete(value: string) {
    this.taskIds.delete(value);
  }
}
