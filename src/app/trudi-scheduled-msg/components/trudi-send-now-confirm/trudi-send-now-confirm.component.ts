import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, filter, switchMap, takeUntil } from 'rxjs';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { ISendMsgConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TrudiScheduledMsgService } from '@/app/trudi-scheduled-msg/services/trudi-scheduled-msg.service';
import { ITrudiScheduledMsgInfo } from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { HelperService } from '@services/helper.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TaskStatusType } from '@shared/enum/task.enum';
import { EConversationStatus } from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';
import { ToastrService } from 'ngx-toastr';
import { EConversationType } from '@shared/enum';

@Component({
  selector: 'trudi-send-now-confirm',
  templateUrl: './trudi-send-now-confirm.component.html',
  styleUrls: ['./trudi-send-now-confirm.component.scss']
})
export class TrudiSendNowConfirmComponent implements OnInit, OnDestroy {
  receiver: string = '';
  configs: ISendMsgConfigs = {
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      icon: ''
    }
  };
  selectedScheduledMsg: ITrudiScheduledMsgInfo;
  public isDisabledSendNowBtn: boolean = false;
  private unsubscribe = new Subject<void>();
  public currentMailBoxId: string;
  public currentParams: Params;
  constructor(
    private trudiScheduledMsgService: TrudiScheduledMsgService,
    private inboxService: InboxService,
    private helperService: HelperService,
    private router: Router,
    private activeRouter: ActivatedRoute,
    private toastrService: ToastrService
  ) {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(filter((mailBoxId) => !!mailBoxId))
      .subscribe((mailBoxId) => {
        this.currentMailBoxId = mailBoxId;
      });
  }

  ngOnInit(): void {
    this.trudiScheduledMsgService.selectedScheduledMsg
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.selectedScheduledMsg = data;
      });
    this.trudiScheduledMsgService.selectedReceiverName
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((receiver) => {
        this.receiver = receiver;
      });
    this.configs = {
      ...this.configs,
      header: {
        ...this.configs.header,
        title: `Are you sure you want to send this message to ${this.receiver} now?`
      }
    };
    this.activeRouter.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.currentParams = rs;
      });
  }

  handleBackScheduleMsg() {
    this.trudiScheduledMsgService.setPopupState({
      sendNowMessage: false,
      scheduledMessage: true
    });
  }

  handleSendNowMessage() {
    const { id, taskId, conversationId } = this.selectedScheduledMsg;
    this.isDisabledSendNowBtn = true;
    // this.trudiScheduledMsgService.triggerEventSendNow.next({
    //   id,
    //   taskId,
    //   conversationId
    // });
    this.trudiScheduledMsgService
      .sendNowMsg(id, this.currentMailBoxId)
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap(() => {
          this.getCountJobsReminder(conversationId);
          return this.trudiScheduledMsgService.getListScheduledMsg(
            taskId,
            conversationId
          );
        })
      )
      .subscribe({
        complete: () => {
          this.trudiScheduledMsgService.setPopupState({
            sendNowMessage: false,
            scheduledMessage:
              this.trudiScheduledMsgService.listScheduledMsg.value.length === 0
                ? false
                : true
          });
          if (this.router?.url.includes('inbox/app-messages/resolved')) {
            this.router.navigate(['dashboard/inbox/app-messages', 'all'], {
              queryParams: {
                status: TaskStatusType.inprogress,
                conversationId: this.currentParams['conversationId']
              },
              queryParamsHandling: 'merge'
            });
            this.toastrService.success('App message reopened');
            return;
          }

          if (
            this.helperService.isInboxDetail &&
            this.currentParams['tab'] === EConversationStatus.resolved &&
            this.currentParams['conversationType'] === EConversationType.APP
          ) {
            this.router.navigate(
              ['/dashboard', 'inbox', 'detail', this.currentParams['taskId']],
              {
                queryParams: {
                  tab: EConversationStatus.open,
                  conversationId: this.currentParams['conversationId'],
                  pendingSelectFirst: true
                },
                queryParamsHandling: 'merge'
              }
            );
            this.toastrService.success('App message reopened');
            return;
          }
        },
        error: () => {
          this.isDisabledSendNowBtn = false;
          this.trudiScheduledMsgService.setPopupState({
            sendNowMessage: false,
            scheduledMessage: true
          });
        }
      });
  }

  getCountJobsReminder(conversationId: string) {
    return this.trudiScheduledMsgService
      .jobRemindersCount(conversationId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.selectedScheduledMsg = null;
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
