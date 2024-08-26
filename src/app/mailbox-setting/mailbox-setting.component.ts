import { switchMap } from 'rxjs/operators';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MAILBOX_TAB } from './utils/constant';
import {
  IMailboxBehaviours,
  MailBoxTab
} from './interface/mailbox-setting.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EMailBoxStatus, EmailProvider } from '@shared/enum/inbox.enum';
import { EMailBoxTablink } from './utils/enum';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MailboxSettingApiService } from './services/mailbox-setting-api.service';
import { MailboxSettingService } from './services/mailbox-setting.service';
import {
  EAddOnType,
  ECRMSystem
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { CompanyService } from '@services/company.service';
import { ActionLinkService } from '@services/action-link.service';
import { ConfigPlan } from '@/app/console-setting/agencies/utils/console.type';
import { showAIReplyFeature } from 'src/environments/environment';
import { GroupType } from '@shared/enum';

@Component({
  selector: 'mailbox-setting',
  templateUrl: './mailbox-setting.component.html',
  styleUrls: ['./mailbox-setting.component.scss']
})
export class MailboxSettingComponent implements OnInit, OnDestroy {
  public readonly defaultMailboxTabs = showAIReplyFeature
    ? MAILBOX_TAB
    : MAILBOX_TAB.filter((tab) => tab.link !== EMailBoxTablink.AI_REPLIES);
  public mailboxTabs: MailBoxTab = MAILBOX_TAB;
  private destroy$ = new Subject<void>();
  private mailboxId: string;
  private configPlans: ConfigPlan;
  public mailBoxId: string;

  constructor(
    private inboxService: InboxService,
    private agencyService: AgencyService,
    private router: Router,
    private mailboxSettingService: MailboxSettingService,
    private mailboxSettingApiService: MailboxSettingApiService,
    private companyService: CompanyService,
    private readonly actionLinkService: ActionLinkService,
    private activeRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activeRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((queryParams) => {
        this.mailBoxId = queryParams['mailBoxId'];
        this.getSaveConversationMailboxSetting();
      });
    this.getCurrentPlan();
    combineLatest([
      this.inboxService.listMailBoxs$,
      this.activeRoute.queryParams
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([listMailBoxs, queryParams]) => {
        const currentMailbox = listMailBoxs?.find(
          (mailbox) => mailbox?.id === queryParams['mailBoxId']
        );

        const isRmEnvironment =
          this.agencyService.environment.value === ECRMSystem.RENT_MANAGER;
        if (currentMailbox?.provider === EmailProvider.SENDGRID) {
          if (!isRmEnvironment) {
            this.mailboxTabs = [
              ...this.mailboxTabs.filter((value) => {
                return value.link !== EMailBoxTablink.MAILBOX_PREFERENCES;
              })
            ];
          }
        } else {
          this.mailboxTabs = [...this.defaultMailboxTabs];
        }
      });

    this.mailboxSettingApiService.isRefreshSaveConversationMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isRefreshSaveConversation) => {
        isRefreshSaveConversation && this.getSaveConversationMailboxSetting();
      });
    this.handleGetListCategoryTaskActivity();
  }

  getCurrentPlan() {
    this.agencyService.currentPlan$
      .pipe(takeUntil(this.destroy$))
      .subscribe((configPlan) => {
        if (!configPlan) return;
        const isSuggestedReplies =
          configPlan.features[EAddOnType.SUGGESTED_REPLIES]?.state;

        this.mailboxTabs = isSuggestedReplies
          ? [...this.defaultMailboxTabs]
          : this.mailboxTabs.filter(
              (item) => item.link !== EMailBoxTablink.AI_REPLIES
            );
      });
  }

  getSaveConversationMailboxSetting() {
    let mailboxSettingRes: IMailboxBehaviours;
    this.mailboxSettingApiService
      .getMailboxPreferencesSetting(
        this.activeRoute.snapshot.queryParams['mailBoxId']
      )
      .pipe(
        takeUntil(this.destroy$),
        switchMap((res: IMailboxBehaviours) => {
          mailboxSettingRes = res;
          return this.companyService
            .getCurrentCompany()
            .pipe(takeUntil(this.destroy$));
        })
      )
      .subscribe((res) => {
        const isRmEnvironment = this.agencyService.isRentManagerCRM(res);
        const fieldToSaveConversation = isRmEnvironment
          ? mailboxSettingRes?.autoSyncConversationNote || false
          : mailboxSettingRes?.autoSyncConversationsToPT || false;
        this.mailboxSettingApiService.isSaveConversationMailbox$.next(
          fieldToSaveConversation
        );
        this.mailboxSettingService.setSaveMailboxSyncTaskActivity({
          autoSyncTaskActivityToPT:
            mailboxSettingRes?.autoSyncTaskActivityToPT || false,
          syncDocumentType: mailboxSettingRes?.syncDocumentType || null,
          saveCategoryDocumentType:
            mailboxSettingRes?.saveCategoryDocumentType || null
        });
      });
  }

  handleGetListCategoryTaskActivity() {
    this.mailboxSettingApiService
      .getCategorySaveTaskActivity()
      .subscribe((listCategory) => {
        if (!listCategory.length) return;
        this.mailboxSettingService.setListCategoryTaskActivity(listCategory);
      });
  }

  handleExit() {
    let preUrl = this.actionLinkService.preUrl;
    if (preUrl) {
      const preMailBoxId = this.inboxService.preMailBoxId.getValue();
      const listMailBoxes = this.inboxService.listMailBoxsValue.filter(
        (item) => item.status !== EMailBoxStatus.ARCHIVE
      );
      const mailBox = listMailBoxes.find(
        (mailBox) => mailBox.id === preMailBoxId
      );
      const url = new URL(preUrl, window.location.origin);
      const params = new URLSearchParams(url.search);
      params.set('mailBoxId', mailBox?.id || listMailBoxes[0].id);
      url.search = params.toString();
      this.router.navigateByUrl(url.pathname + url.search).then(() => {
        this.inboxService.preMailBoxId.next(null);
        this.inboxService.setIsArchiveMailbox(false);
      });
    } else {
      const isFocus = localStorage.getItem('mailbox-focus')
        ? GroupType.MY_TASK
        : GroupType.TEAM_TASK;
      this.router.navigateByUrl(
        `dashboard/inbox/messages/all?inboxType=${isFocus}&status=INPROGRESS&mailBoxId=${this.activeRoute.snapshot.queryParams['mailBoxId']}`
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
