import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Conversation } from '@/app/task-detail/modules/app-chat/components/ai-summary/models';

@Injectable()
export class ConversationState {
  private readonly _conversations$ = new BehaviorSubject<Conversation[]>(null);
  private readonly _selectedConversation$ = new BehaviorSubject<Conversation>(
    null
  );
  private readonly _previouseConversations$ = new BehaviorSubject<Conversation>(
    null
  );

  public readonly conversations$ = this._conversations$.asObservable();
  public readonly selectedConversation$ =
    this._selectedConversation$.asObservable();

  public readonly previouseConversations$ =
    this._previouseConversations$.asObservable();

  public setConversations(conversations: Conversation[]) {
    this._conversations$.next(conversations);
  }

  public setSelectedConversation(conversation: Conversation) {
    this._previouseConversations$.next(this._selectedConversation$.getValue());
    this._selectedConversation$.next(conversation);
  }

  public resetData() {
    this.setConversations(null);
    this.setSelectedConversation(null);
  }
}
