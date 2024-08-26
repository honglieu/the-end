import { transition, trigger, useAnimation } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  Observable,
  Subject,
  Subscription,
  combineLatest,
  delay,
  takeUntil
} from 'rxjs';
import {
  closeMenu,
  openMenu
} from '@/app/dashboard/animation/triggerToolbarAnimation';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { Toolbar } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { FolderType } from '@shared/enum/inbox.enum';
import { EInboxAction } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { FolderService } from '@/app/dashboard/modules/inbox/services/inbox-folder.service';
import { ActivatedRoute, Params } from '@angular/router';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { TaskStatusType } from '@shared/enum/task.enum';
import { EMessageQueryType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { LABEL_NAME_OUTLOOK } from '@services/constants';
import { CompanyService } from '@services/company.service';
import { AppRouteName } from '@shared/enum/app-route-name.enum';

@Component({
  selector: 'inbox-toolbar',
  templateUrl: './inbox-toolbar.component.html',
  styleUrls: ['./inbox-toolbar.component.scss'],
  animations: [
    trigger('toolbarAnimation', [
      transition(':enter', [useAnimation(openMenu)]),
      transition(':leave', [useAnimation(closeMenu)])
    ])
  ]
})
export class InboxToolbarComponent implements OnInit, OnDestroy {
  public toolbars: Toolbar[] = [];
  public visible!: boolean;
  public EInboxAction = EInboxAction;
  public isAssignedToMultipleMailBox: boolean = false;
  public isDropdownVisible: boolean = false;
  public isSpamFolder: boolean = false;
  public currentQueryParams: Params;
  public hasMessageInTask: boolean;
  public isShowToolbarDelayed$: Observable<boolean>;
  public readonly routeName = AppRouteName;
  public readonly inboxAction = EInboxAction;
  public readonly folderType = FolderType;
  private destroy$ = new Subject();
  resizeObservable$: Observable<Event>;
  resizeSubscription$: Subscription;

  constructor(
    private readonly companyService: CompanyService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly inboxService: InboxService,
    public readonly inboxToolbarService: InboxToolbarService,
    public readonly folderService: FolderService
  ) {}

  ngOnInit(): void {
    this.subscribleInboxItem();
    this.subscribleCurrentMailbox();
    this.subscribleToolbarConfig();
    this.isShowToolbarDelayed$ = this.inboxToolbarService.isShowToolbar.pipe(
      delay(150)
    );
  }

  private subscribleInboxItem() {
    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((inboxItems) => {
        this.hasMessageInTask = inboxItems.some((item) => item.isMessageInTask);
      });
  }

  private subscribleCurrentMailbox() {
    combineLatest([
      this.activatedRoute.queryParams,
      this.inboxService.currentMailBox$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([params, mailBox]) => {
        this.currentQueryParams = params;
        this.isSpamFolder =
          this.currentQueryParams['externalId'] ===
          mailBox?.spamFolder?.externalId;
      });
  }

  private subscribleToolbarConfig() {
    this.inboxToolbarService.listToolbarConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: Toolbar[]) => {
        const currentCompanyId = this.companyService.currentCompanyId();
        const companyAgents = this.companyService.listCompanyAgentValue;

        this.isAssignedToMultipleMailBox = companyAgents.find(
          (item) => item?.companyId === currentCompanyId
        )?.isAssignedToMultipleMailBox;

        if (!this.isAssignedToMultipleMailBox) {
          data = data.filter((item) => item?.key !== EInboxAction.FORWARD);
        }
        const filterSpam = this.isSpamFolder
          ? EInboxAction.REPORT_SPAM
          : EInboxAction.NOT_SPAM;
        const dataFilter =
          this.currentQueryParams[EMessageQueryType.MESSAGE_STATUS] !==
          TaskStatusType.mailfolder
            ? EInboxAction.NOT_SPAM
            : filterSpam;
        data = data.filter((item) => item?.key !== dataFilter);
        const currentFolder = this.folderService.getCurrentFolder(
          this.currentQueryParams[EMessageQueryType.EXTERNAL_ID],
          this.currentQueryParams['mailBoxId']
        );
        if (currentFolder?.wellKnownName === LABEL_NAME_OUTLOOK.SENT_ITEMS) {
          data = data.filter((item) => item?.key !== EInboxAction.REPORT_SPAM);
        }

        this.toolbars = [...data] || [];
        this.visible = !!data;
      });
  }

  handleToolbarAction(
    action: (event) => {},
    isLastAction: boolean = false,
    event: Event
  ) {
    action(event);
    if (isLastAction) {
      this.isDropdownVisible = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
