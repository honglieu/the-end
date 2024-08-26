import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  of,
  Subject,
  switchMap
} from 'rxjs';
import { ILinkedActions } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-linked/widget-linked.interface';
import { ApiService } from '@/app/services/api.service';
import { conversations } from '@/environments/environment';
import { SummaryMessageDialogService } from '@/app/task-detail/modules/summary-message-dialog/services/summary-message-dialog.service';
import { EMessageConversationType } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { VoiceMailApiService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail-api.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { FileCarousel } from '@/app/shared';
import { IActionItem } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';

export interface ILoadFile {
  file: FileCarousel;
  selectedFileId: string;
}

@Injectable({
  providedIn: 'root'
})
export class WidgetLinkedService {
  private linkedActionBS$ = new BehaviorSubject<ILinkedActions[]>([]);
  private isLoading = false;
  public linkedAction$ = this.linkedActionBS$.asObservable();
  public triggerLoadFile$ = new Subject<ILoadFile>();
  public triggerRequestItem$ = new Subject<IActionItem>();

  constructor(
    private apiService: ApiService,
    private summaryMsgDialogService: SummaryMessageDialogService,
    private voiceMailApiService: VoiceMailApiService,
    private showSidebarRightService: ShowSidebarRightService
  ) {}

  public actionItemData$ = combineLatest([
    this.linkedActionBS$,
    this.showSidebarRightService.isShowSidebarRight$
  ]).pipe(
    filter(([actionItem, showSideBar]) => showSideBar),
    switchMap(([actionItem, showSideBar]) => {
      const conversationType = actionItem?.[0]?.conversation?.conversationType;
      const conversationId = actionItem?.[0]?.conversation?.id;
      const actionItemId = actionItem?.[0]?.id;
      this.isLoading = true;

      switch (conversationType) {
        case EMessageConversationType.VOICE_MAIL:
        case EMessageConversationType.APP:
        case EMessageConversationType.SMS:
        case EMessageConversationType.WHATSAPP:
        case EMessageConversationType.MESSENGER:
          return this.summaryMsgDialogService
            .getMessageSummary(conversationId)
            .pipe(
              map((res) => {
                const summary = res?.summaries?.find((i) => {
                  const messageRequest = i?.messageRequest;
                  return messageRequest?.some(
                    (request) => request?.messageId === actionItemId
                  );
                });

                const request = summary?.messageRequest?.find(
                  (i) => i?.messageId === actionItemId
                );
                this.isLoading = false;
                return {
                  actionItem: request,
                  additionalData: {
                    sessionId: summary?.sessionId,
                    displayName: summary?.displayName,
                    channelUserName: summary?.channelUserName,
                    emailMetaData: summary?.emailMetaData
                  }
                };
              })
            );
        case EMessageConversationType.EMAIL:
          return this.summaryMsgDialogService
            .getMessageSummary(conversationId)
            .pipe(
              map((res) => {
                const summary = res?.find((i) => {
                  const messageRequest = i?.messageRequest;
                  return messageRequest?.some(
                    (request) => request?.messageId === actionItemId
                  );
                });

                const request = summary?.messageRequest?.find(
                  (i) => i?.messageId === actionItemId
                );
                this.isLoading = false;
                return {
                  actionItem: request,
                  additionalData: {
                    sessionId: summary?.messageId,
                    emailMetaData: summary?.emailMetaData
                  }
                };
              })
            );
        default:
          this.isLoading = false;
          return of(null);
      }
    })
  );

  public isLoadingActionItem() {
    return this.isLoading;
  }

  unLinkActionToTask(payload) {
    return this.apiService.postAPI(
      conversations,
      'task/linked-action-to-task',
      payload
    );
  }

  setLinkedActionBS(value) {
    this.linkedActionBS$.next(value);
  }

  resetLinkedActionBS() {
    this.linkedActionBS$.next([]);
  }
}
