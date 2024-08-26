import {
  animate,
  keyframes,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Router } from '@angular/router';
import { Toast, ToastrService, ToastPackage } from 'ngx-toastr';
import { ToastCustomService } from './toast-custom.service';
import { EInboxQueryParams } from '@shared/enum/inbox.enum';
import { EToastCustomType } from './toastCustomType';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { IMailBox } from '@shared/types/user.interface';
import { CompanyService } from '@services/company.service';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { Subject, takeUntil } from 'rxjs';
import { ConversationService } from '@/app/services/conversation.service';
import { FacebookDetailTaskMemoryCacheService } from '@/app/core/store/facebook-detail/services/facebook-detail-task-memory-cache.service';
import { WhatsappDetailTaskMemoryCacheService } from '@/app/core/store/whatsapp-detail/services/whatsapp-detail-task-memory-cache.service';

@Component({
  selector: '[toast-custom-component]',
  styleUrls: [`./toast-custom.component.scss`],
  templateUrl: `./toast-custom.component.html`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('flyInOut', [
      state(
        'inactive',
        style({
          opacity: 1
        })
      ),
      transition(
        'inactive <=> active',
        animate(
          '500ms ease-out',
          keyframes([
            style({
              offset: 0,
              opacity: 0
            }),
            style({
              offset: 0.7,
              opacity: 1
            }),
            style({
              offset: 1
            })
          ])
        )
      ),
      transition(
        'active => removed',
        animate(
          '500ms ease-in',
          keyframes([
            style({
              opacity: 1,
              offset: 0.2
            }),
            style({
              opacity: 0,
              offset: 1
            })
          ])
        )
      )
    ])
  ],
  preserveWhitespaces: false
})
export class ToastCustomComponent extends Toast implements OnInit, OnDestroy {
  public toastDataE2e = 'toast-custom';
  public reportSpamSuccess: boolean;
  public isErrorToastVisible: boolean;
  private timeOut: NodeJS.Timeout;
  readonly EToastCustomType = EToastCustomType;
  public mailBoxIntegrateId: string = '';
  readonly EButtonType = EButtonType;
  readonly EButtonTask = EButtonTask;
  private destroy$ = new Subject<boolean>();

  constructor(
    protected override toastrService: ToastrService,
    public override toastPackage: ToastPackage,
    private toastCustomService: ToastCustomService,
    private router: Router,
    private inboxService: InboxService,
    private mailboxSettingService: MailboxSettingService,
    private companyService: CompanyService,
    private readonly inboxToolbarService: InboxToolbarService,
    private readonly conversationService: ConversationService,
    private readonly facebookDetailTaskMemoryCacheService: FacebookDetailTaskMemoryCacheService,
    private readonly whatsappDetailTaskMemoryCacheService: WhatsappDetailTaskMemoryCacheService
  ) {
    super(toastrService, toastPackage);
    this.reportSpamSuccess = this.toastCustomService.getReportSpamSuccess();
    this.isErrorToastVisible = this.toastCustomService.getToastError();
  }

  ngOnInit(): void {
    this.getMailBoxIntegrateId();
  }

  get toastType() {
    return this.toastPackage.toastType;
  }

  onReloadPage() {
    window.location.reload();
  }

  handleUndoReportSpam() {
    this.toastCustomService.handleUndoReportSpam();
  }

  handleUndoReminderMsg() {
    this.toastCustomService.handleUndoReminderMessage();
  }

  updateListMailBoxs(list: IMailBox[], currentCompanyId) {
    const companyAgents = this.companyService.listCompanyAgentValue;
    const updatedCompanyAgents = companyAgents.map((company) => {
      if (company.companyId === currentCompanyId) {
        const uniqueIds = {};
        const filteredArray = list.filter((item) => {
          if (!uniqueIds[item.id]) {
            uniqueIds[item.id] = true;
            return true;
          }
          return false;
        });

        company.mailBoxes = filteredArray;
      }

      return company;
    });
    this.companyService.setListCompanyAgent(updatedCompanyAgents);
  }
  getMailBoxIntegrateId() {
    this.inboxService
      .getMailBoxIntegrateId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.mailBoxIntegrateId = value;
      });
  }
  navigateToDetailPage() {
    if (!this.title) return;
    const params = this.parseUrl().paramsArray.filter(
      (param) => param !== 'undefined'
    );
    const queryParam = this.parseUrl().queryParamsObject as any;

    if (this.mailBoxIntegrateId) {
      const mailBoxActive = this.inboxService.listMailBoxsValue.find(
        (item) => item.id === this.mailBoxIntegrateId
      );
      this.inboxService.setCurrentMailBox(mailBoxActive);
      this.inboxService.setCurrentMailBoxId(mailBoxActive.id);
      this.mailboxSettingService.setMailBoxId(mailBoxActive.id);
      this.mailboxSettingService.setRole(mailBoxActive.role);
      localStorage.removeItem('integrateType');
      this.updateListMailBoxs(
        this.inboxService.listMailBoxsValue,
        this.mailBoxIntegrateId
      );
    }
    if (
      params?.includes(EInboxQueryParams.MESSAGES) ||
      params?.includes(EInboxQueryParams.TASKS)
    ) {
      queryParam.externalId = null;
      queryParam.threadId = null;
      queryParam.emailMessageId = null;
      queryParam.conversationId = queryParam.conversationId || null;
    }

    if (
      params?.includes(EInboxQueryParams.MESSAGES) ||
      params?.includes(EInboxQueryParams.EMAIL) ||
      params?.includes(EInboxQueryParams.APP_MESSAGE) ||
      params?.includes(EInboxQueryParams.VOICEMAIL_MESSAGES)
    ) {
      queryParam.taskStatus = null;
      queryParam.taskTypeID = null;
      queryParam.type = null;
      queryParam.appMessageCreateType = null;
      queryParam.sortTaskType = null;
    }

    if (
      params?.includes(EInboxQueryParams.TASKS) ||
      params?.includes(EInboxQueryParams.EMAIL)
    ) {
      queryParam.taskId = null;
    }

    const taskDetailRoute = '/inbox/detail/';
    const navigateRoute = ['dashboard', ...params];
    const route = navigateRoute.join('/');

    if (
      this.router.url.includes(taskDetailRoute) &&
      route.includes(taskDetailRoute)
    ) {
      // Reload page when navigating from one task detail to another
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() =>
        setTimeout(() => {
          this.router.navigate(navigateRoute, {
            queryParams: {
              ...queryParam,
              tab: queryParam['keepTab'] ? queryParam['tab'] : null,
              keepTab: null
            },
            queryParamsHandling: 'merge'
          });
        }, 0)
      );
    } else {
      this.router.navigate(navigateRoute, {
        queryParams: {
          ...queryParam,
          reminderType: queryParam['reminderType'] || ''
        },
        queryParamsHandling: 'merge'
      });
      this.conversationService.triggerGoToAppMessage$.next(true);
    }

    if (
      [
        ERouterLinkInbox.MSG_DRAFT,
        ERouterLinkInbox.MSG_COMPLETED,
        ERouterLinkInbox.MSG_DELETED
      ].some((item) => route.includes(item))
    ) {
      this.inboxService.isOpenMoreInboxSidebar$.next();
    }

    if (
      route.includes(ERouterLinkInbox.MSG_INPROGRESS_ALL) ||
      route.includes(ERouterLinkInbox.APP_MESSAGES_ALL) ||
      route.includes(ERouterLinkInbox.APP_MESSAGES_RESOLVED)
    ) {
      this.inboxToolbarService.triggerResetMessageDetail$.next();
    }

    if (route.includes(ERouterLinkInbox.MESSENGER)) {
      this.facebookDetailTaskMemoryCacheService.delete(queryParam.taskId);
    }

    if (route.includes(ERouterLinkInbox.WHATSAPP)) {
      this.whatsappDetailTaskMemoryCacheService.delete(queryParam.taskId);
    }

    if (route.includes(ERouterLinkInbox.OUT_LOOK_OR_GMAIL)) {
      this.inboxService.isOpenEmailFolderByBtnViewToast$.next(
        queryParam.mailBoxId
      );
    }
    this.remove();
  }

  parseUrl() {
    if (!this.title) return null;
    const urlObject = new URL(this.title);
    const paramsArray = urlObject.pathname.split('/').filter(Boolean);
    const queryParamsObject = {};
    urlObject.searchParams.forEach((value, key) => {
      queryParamsObject[key] = value;
    });
    return { paramsArray, queryParamsObject };
  }

  handleRemove(e: Event) {
    e.stopPropagation();
    this.remove();
  }

  action(event: Event) {
    event.stopPropagation();
    this.toastPackage.triggerAction();
    this.remove();
    return false;
  }

  override ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    clearTimeout(this.timeOut);
    super.ngOnDestroy();
  }

  handleShowSettingAIReply() {
    this.toastCustomService.handleShowSettingAIReply();
  }

  handleShowMergeToast() {
    this.toastCustomService.handleShowMergeToast();
  }

  openMergePopup() {
    this.mailboxSettingService.setIsOpenPopupMerge(true);
  }

  openSettingAIReply(type: EToastCustomType) {
    const queryParams = {
      showAfterMerge: type === EToastCustomType.SUCCESS_WITH_VIEW_AI_REPLY_BTN
    };

    const navigateRoute = ['dashboard', 'mailbox-settings', 'ai-replies'];
    this.router.navigate(navigateRoute, { queryParams });
  }

  handleRetryExportActivityPDFFile(toastType: EToastCustomType) {
    this.toastCustomService.handleRetryExportActivityPDFFile(toastType);
  }
}
