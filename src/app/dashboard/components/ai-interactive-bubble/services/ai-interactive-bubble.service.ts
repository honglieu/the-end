import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  IInteractiveAi,
  IOptionButton
} from '@/app/dashboard/components/ai-interactive-bubble/interfaces/ai-interactive-bubble.interface';
import { updateEmail } from '@/app/dashboard/components/ai-interactive-bubble/utils/ai-interactive-helper';
import { TrudiAIWebSocketResponse } from '@/app/core/websocket/types';

@Injectable()
export class AiInteractiveBubbleService {
  private listInteractiveAiBS: BehaviorSubject<IInteractiveAi[]> =
    new BehaviorSubject([]);
  public listInteractiveAi$ = this.listInteractiveAiBS.asObservable();
  public isGeneratingText$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  private suggestButtonsBS = new BehaviorSubject<IOptionButton[]>([]);
  public suggestButton$ = this.suggestButtonsBS.asObservable();
  public waitingPrompt: string;
  public triggerRecalculateSize$ = new Subject();

  public listIgnoredMessageIds = new Set();
  setListInteractiveAi(value) {
    this.listInteractiveAiBS.next(value);
  }

  addDataInteractiveAi(data: IInteractiveAi) {
    this.listInteractiveAiBS.next([
      ...this.listInteractiveAiBS.getValue(),
      data
    ]);
  }

  restListInteractiveAi() {
    return this.listInteractiveAiBS.next([]);
  }

  updateDataInteractiveAi(updatedData: IInteractiveAi) {
    const updatedList = this.listInteractiveAiBS
      .getValue()
      .map((item) => (item.id === updatedData.id ? updatedData : item));
    this.listInteractiveAiBS.next(updatedList);
  }

  public setSuggestButtons(buttons: IOptionButton[]) {
    this.suggestButtonsBS.next(buttons);
  }

  public stopGenerating(messageId: string) {
    let list = this.listInteractiveAiBS.value;
    const message = list.find((item) => item.id === messageId);
    if (message) {
      this.listIgnoredMessageIds.add(message.id);
      message.isGenerating = false;
      list = list.map((item) => {
        if (item.id === messageId) {
          return {
            ...item,
            isGenerating: false
          };
        }
        return item;
      });
      this.listInteractiveAiBS.next(list);
      this.isGeneratingText$.next(false);
    }
  }

  public pushReply(draftEmailResponse: DraftEmailResponseDTO) {
    try {
      const messageId = draftEmailResponse.message_id;
      let list = this.listInteractiveAiBS.value;
      const message = list.find((item) => item.id === messageId);
      const { draft, isCompleted } = updateEmail(
        draftEmailResponse.payload.response
      );
      if (this.isGeneratingText$.value !== !isCompleted) {
        this.isGeneratingText$.next(!isCompleted);
      }
      let updatedMessages: IInteractiveAi[] = [];
      if (message) {
        updatedMessages = list.map((item) =>
          item.id === messageId
            ? {
                ...item,
                isGenerating: !isCompleted,
                reply: draft
              }
            : item
        );
      } else {
        updatedMessages = list.concat({
          id: messageId,
          isGenerating: false,
          prompt: this.waitingPrompt,
          reply: draft
        });
        this.setWaitingPrompt(null);
      }
      this.triggerRecalculateSize$.next(messageId);
      this.listInteractiveAiBS.next(updatedMessages);
    } catch (error) {}
  }

  setWaitingPrompt(value: string) {
    this.waitingPrompt = value;
  }
}

export interface DraftEmailResponseDTO extends TrudiAIWebSocketResponse {
  timestamp: string;
  payload: {
    function_name: string;
    response: string;
  };
  message_id: string;
  sender: string;
  thread_id: string;
}
