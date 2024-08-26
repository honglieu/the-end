import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { EMailBoxType, EmailProvider } from '@shared/enum/inbox.enum';
import { EMAIL_SYNC_TYPE } from '@/app/mailbox-setting/utils/constant';
import * as Sentry from '@sentry/angular-ivy';
import { TaskService } from '@services/task.service';
import { SharedWorkerService } from '@/app/shared-worker.service';

@Component({
  selector: 'outlook-callback',
  templateUrl: './outlook-callback.component.html',
  styleUrls: ['./outlook-callback.component.scss']
})
export class OutLookCallBackComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private dashboardApiService: DashboardApiService,
    private taskService: TaskService,
    private sharedWorkerService: SharedWorkerService
  ) {}

  ngOnInit() {
    const outlookCode = this.route.snapshot.queryParamMap.get('code');
    const integrateType = localStorage.getItem('integrateType');
    Sentry.captureMessage(
      `outlookCode: ${outlookCode},integrateType: ${integrateType} `,
      'debug'
    );
    switch (integrateType) {
      case EMAIL_SYNC_TYPE.INTEGRATE_MAIL:
        this.handleConnectOutlook(outlookCode);
        break;
      case EMAIL_SYNC_TYPE.CONNECT_AGAIN:
        this.handleReconnectOutlook(outlookCode);
        break;
      case EMAIL_SYNC_TYPE.INTEGRATE_CALENDAR:
        this.handleConnectOutlookCalendar(outlookCode);
        break;
      case EMAIL_SYNC_TYPE.RECONNECT_CALENDAR:
        this.handleReconnectOutlookCalendar(outlookCode);
        break;
      default:
        break;
    }
  }
  handleConnectOutlook(outlookCode: string) {
    if (outlookCode) {
      this.dashboardApiService
        .integrateEmailProvider(
          {
            code: outlookCode,
            type: localStorage.getItem('mailBoxType') as EMailBoxType
          },
          EmailProvider.OUTLOOK
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe({
          next: (res) => {
            this.postSharedMsg(res, true, EMAIL_SYNC_TYPE.INTEGRATE_MAIL);
          },
          error: ({ error }) => {
            this.postSharedMsg(error, false, EMAIL_SYNC_TYPE.INTEGRATE_MAIL);
          }
        });
    } else {
      this.postSharedMsg(null, false, null);
    }
  }

  handleReconnectOutlook(outlookCode: string) {
    if (outlookCode) {
      this.dashboardApiService
        .connectMailboxAgain({
          code: outlookCode,
          type: localStorage.getItem('mailBoxType') as EMailBoxType,
          mailBoxId: localStorage.getItem('reconnectMailBoxId')
        })
        .pipe(takeUntil(this.unsubscribe))
        .subscribe({
          next: (res) => {
            this.postSharedMsg(res || {}, true, EMAIL_SYNC_TYPE.CONNECT_AGAIN);
          },
          error: () => {
            this.postSharedMsg(
              'connect failed',
              false,
              EMAIL_SYNC_TYPE.CONNECT_AGAIN
            );
          }
        });
    } else {
      this.postSharedMsg(null, false, null);
    }
  }

  handleConnectOutlookCalendar(outlookCode: string) {
    if (outlookCode) {
      this.dashboardApiService
        .integrateCalendarProvider({
          code: outlookCode,
          type: EmailProvider.OUTLOOK
        })
        .pipe(takeUntil(this.unsubscribe))
        .subscribe({
          next: (res) => {
            this.postSharedMsg(res, true, EMAIL_SYNC_TYPE.INTEGRATE_CALENDAR);
          },
          error: ({ error }) => {
            this.postSharedMsg(
              error,
              false,
              EMAIL_SYNC_TYPE.INTEGRATE_CALENDAR
            );
          }
        });
    } else {
      this.postSharedMsg(null, false, null);
    }
  }

  handleReconnectOutlookCalendar(outlookCode: string) {
    if (outlookCode) {
      this.dashboardApiService
        .connectAgainCalendar({
          code: outlookCode,
          type: EmailProvider.OUTLOOK,
          userCalendarSettingId: localStorage.getItem('userCalendarSettingId')
        })
        .pipe(takeUntil(this.unsubscribe))
        .subscribe({
          next: (res) => {
            this.postSharedMsg(
              res || {},
              true,
              EMAIL_SYNC_TYPE.RECONNECT_CALENDAR
            );
          },
          error: () => {
            this.postSharedMsg(
              'connect failed',
              false,
              EMAIL_SYNC_TYPE.RECONNECT_CALENDAR
            );
          }
        });
    } else {
      this.postSharedMsg(null, false, null);
    }
  }

  postSharedMsg(res, isSuccess: boolean, type: string) {
    const message = {
      action: 'closetab',
      payload: res,
      isSuccess,
      type
    };
    Sentry.captureMessage(
      `Data shared worker: ${JSON.stringify(
        res || ''
      )},type: ${type}, isSuccess: ${isSuccess}`,
      'debug'
    );
    this.sharedWorkerService.postMessageToSharedWorker(message);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
