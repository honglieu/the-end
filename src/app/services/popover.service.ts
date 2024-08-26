import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PopoverService {
  public name$: BehaviorSubject<string> = new BehaviorSubject('');
  private actionConversationID$ = new BehaviorSubject(null);
  constructor() {}

  public get actionConversationBS() {
    return this.actionConversationID$.asObservable();
  }

  public setActionConversation(id: string) {
    this.actionConversationID$.next(id);
  }
}
