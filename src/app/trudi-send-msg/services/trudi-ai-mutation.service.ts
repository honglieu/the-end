import { TrudiAIWebSocketService } from '@core';
import {
  TrudiAIWebSocketAction,
  TrudiAIWebSocketCommandType,
  TrudiAIWebSocketResponse
} from '@core';
import { Injectable } from '@angular/core';
import { Subject, filter, takeUntil } from 'rxjs';
import uuid4 from 'uuid4';
import { AiInteractiveBuilderService } from '@/app/shared/components/tiny-editor/services/ai-interactive-builder.service';
import { EMutationChannel } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';

@Injectable()
export class TrudiAIMutationService {
  private _threadId: string | undefined;
  private readonly _leaveThread$ = new Subject<void>();
  private readonly _onMessage$ = new Subject<TrudiAIWebSocketResponse>();
  public readonly onMessage$ = this._onMessage$.asObservable();
  public readonly onThreadJoined$ = this.onMessage$.pipe(
    filter((data) => {
      return (
        data.action === TrudiAIWebSocketAction.SYSTEM_NOTIFICATION &&
        this.getThreadId() === data['thread_id'] &&
        (data['payload'] as string)?.includes(this.threadId)
      );
    })
  );

  private currentState;
  private oldState;
  private dynamicCRM;

  public get threadId(): string | undefined {
    return this._threadId;
  }

  constructor(
    private readonly trudiAIWebSocketService: TrudiAIWebSocketService,
    private aiInteractiveBuilderService: AiInteractiveBuilderService
  ) {}

  public initWS(): string {
    this._getDynamicCRM();
    this._threadId = uuid4();
    this._connectWebSocket(this._threadId);
    return this.threadId;
  }

  /**
   * Important: Must be called when the user leaves the thread
   */
  public leaveThread(): void {
    this._threadId = undefined;
    this._disconnectWebSocket();
  }

  public getThreadId(): string {
    return this._threadId;
  }

  public sendMessage(payload: TrudiAIWebSocketResponse): void {
    this.trudiAIWebSocketService.sendMessage(payload);
  }

  public setState(emailHistory: string[], emailState: string) {
    this.oldState = {};
    this.currentState = {
      context: {},
      email_history: emailHistory,
      email_state: emailState
    };
    this.sendMessage({
      action: TrudiAIWebSocketAction.SET_STATE,
      thread_id: this._threadId,
      sender: 'human',
      payload: JSON.stringify(this.currentState)
    });
  }

  updateState(emailHistory: string[], emailState: string) {
    this.oldState = this.currentState;
    this.currentState = {
      context: {},
      email_history: '',
      email_state: emailState
    };
  }

  public generateEmail(payload: {
    text: string;
    propertyId: string;
    conversationId: string;
    receiverUserIds: string[];
    isDynamicVariable: boolean;
    channel: EMutationChannel;
  }) {
    this.sendMessage({
      action: TrudiAIWebSocketAction.COMMAND,
      thread_id: this._threadId,
      sender: 'human',
      payload: JSON.stringify({
        function_name: TrudiAIWebSocketCommandType.GENERATE_MESSAGE,
        payload: {
          text: payload.text,
          property_id: payload.propertyId,
          conversation_id: payload.conversationId || '',
          receive_user_ids: payload.receiverUserIds,
          dynamic_variable: payload.isDynamicVariable ? this.dynamicCRM : null
        }
      }),
      channel: payload.channel || EMutationChannel.OTHER
    });
  }

  public stopGenerate(messageId: string) {
    this.sendMessage({
      action: TrudiAIWebSocketAction.STOP_GENERATE,
      thread_id: this._threadId,
      sender: 'human',
      payload: TrudiAIWebSocketAction.STOP_GENERATE,
      message_id: messageId
    });
  }

  public updateEmailState(newEmailState) {
    this.oldState = this.currentState;
    this.currentState = {
      context: {},
      email_history: this.currentState?.email_history || [],
      email_state: newEmailState
    };
  }

  public endTyping() {
    this.sendMessage({
      action: TrudiAIWebSocketAction.STATE_CHANGE_TRIGGER,
      thread_id: this._threadId,
      sender: 'human',
      payload: JSON.stringify({
        trigger: 'end_typing',
        old_state: this.oldState,
        state: this.currentState
      })
    });
  }

  private _connectWebSocket(threadId: string): void {
    this.trudiAIWebSocketService
      .connect(threadId)
      .pipe(takeUntil(this._leaveThread$))
      .subscribe({
        next: (response) => {
          this._onMessage$.next(response);
        },
        error: (error) => {
          console.error('error', error);
        }
      });
  }

  private _disconnectWebSocket(): void {
    this._leaveThread$.next();
    this._leaveThread$.complete();
    this.trudiAIWebSocketService.disconnect();
  }

  private _getDynamicCRM() {
    this.aiInteractiveBuilderService.dynamicVariableBS
      .pipe(takeUntil(this._leaveThread$))
      .subscribe((res) => {
        this.dynamicCRM = res;
      });
  }
}
