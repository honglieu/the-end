import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subject, combineLatest, distinctUntilChanged, takeUntil } from 'rxjs';
import { ReminderMessageType } from '@/app/dashboard/modules/inbox/enum/reminder-message.enum';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { MessageConversationIdSetService } from './services/message-id-set.service';
import { AppMessageListService } from './services/app-message-list.service';
import { ComposeEditorType } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/app-compose-message.component';
import { EAppMessageCreateType } from './enum/message.enum';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { ISendMsgConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { CompanyService } from '@services/company.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { AppMessageLoadingService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-loading.service';

@Component({
  selector: 'app-message-list',
  templateUrl: './app-message-list.component.html',
  styleUrls: ['./app-message-list.component.scss'],
  providers: []
})
export class AppMessageListComponent implements OnInit, OnDestroy {
  public readonly EViewDetailMode = EViewDetailMode;
  private readonly destroy$ = new Subject<void>();
  public showTaskDetail: boolean = false;
  public hasSelectedInbox: boolean = false;
  public queryParam: Params = {};
  public isReminderMessage: boolean = false;
  public isCreateNewMessage = false;
  readonly ReminderMessageType = ReminderMessageType;
  readonly ComposeEditorType = ComposeEditorType;
  public createAppMessageConfigs: ISendMsgConfigs = {
    ...defaultConfigs,
    inputs: {
      ...defaultConfigs.inputs,
      isAppMessage: true
    },
    otherConfigs: {
      ...defaultConfigs.otherConfigs,
      createMessageFrom: ECreateMessageFrom.APP_MESSAGE,
      isCreateMessageType: true
    },
    body: {
      ...defaultConfigs.body,
      tinyEditor: {
        ...defaultConfigs.body.tinyEditor,
        isShowDynamicFieldFunction: true
      }
    }
  };
  public activeMobileApp: boolean = false;

  constructor(
    private readonly messageConversationIdSetService: MessageConversationIdSetService,
    private readonly inboxToolbarService: InboxToolbarService,
    private readonly activatedRoute: ActivatedRoute,
    private appMessageListService: AppMessageListService,
    private companyService: CompanyService,
    private appMessageLoadingService: AppMessageLoadingService
  ) {}

  public isCreateMessageAppLoading$ =
    this.appMessageLoadingService.createNewMessageLoading$;
  ngOnInit(): void {
    this.onMessageIdsChanged();
    this.onSelectedInboxChanged();
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((queryParam) => {
        this.queryParam = queryParam;
        const appMessageCreateType = queryParam['appMessageCreateType'];
        this.appMessageListService.setIsCreateNewMessage(
          appMessageCreateType === EAppMessageCreateType.NewAppMessage
        );
        this.isReminderMessage = [
          ReminderMessageType.UNANSWERED,
          ReminderMessageType.FOLLOW_UP
        ].includes(queryParam['reminderType']);
      });

    this.companyService
      .getActiveMobileApp()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.activeMobileApp = res));
  }

  private onSelectedInboxChanged(): void {
    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((inboxItem) => {
        this.hasSelectedInbox = Boolean(inboxItem.length);
      });
  }

  private onMessageIdsChanged() {
    combineLatest([
      this.messageConversationIdSetService.isMessageIdsEmpty$,
      this.appMessageListService.isCreateNewMessage$,
      this.appMessageListService.isMoveToExistingTask$
    ])
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(
        ([isMessageIdsEmpty, isCreateNewMessage, isMoveToExistingTask]) => {
          this.isCreateNewMessage =
            isCreateNewMessage ||
            this.queryParam['appMessageCreateType'] ===
              EAppMessageCreateType.ReplyViaApp ||
            this.queryParam['appMessageCreateType'] ===
              EAppMessageCreateType.NewAppMessageDone;
          if (this.isCreateNewMessage) {
            this.showTaskDetail = true;
            return;
          }
          if (isMoveToExistingTask) {
            this.showTaskDetail = true;
            return;
          }
          if (this.queryParam['fromScratch']) {
            this.showTaskDetail = true;
            return;
          }

          this.showTaskDetail = !isMessageIdsEmpty;
        }
      );
    this.inboxToolbarService.triggerResetMessageDetail$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.messageConversationIdSetService.setIsMessageIdsEmpty(true);
      });
  }

  ngOnDestroy(): void {
    this.appMessageListService.setPreFillCreateNewMessage(null);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
