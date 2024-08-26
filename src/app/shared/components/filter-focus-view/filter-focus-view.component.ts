import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LIMIT_TASK_LIST } from '@/app/dashboard/utils/constants';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { GroupType } from '@shared/enum/user.enum';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { Subject, combineLatest, filter, takeUntil } from 'rxjs';
import { SharedService } from '@services/shared.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { UserService } from '@/app/dashboard/services/user.service';
import { CurrentUser } from '@shared/types/user.interface';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { SplashScreenService } from '@/app/splash-screen/splash-screen.service';
import { EDataE2EInbox, EDataE2ENavHeader } from '@shared/enum/E2E.enum';
import { TaskStatusType } from '@shared/enum/task.enum';

@Component({
  selector: 'filter-focus-view',
  templateUrl: './filter-focus-view.component.html',
  styleUrls: ['./filter-focus-view.component.scss']
})
export class FilterFocusViewComponent implements OnInit, OnDestroy {
  @Input() taskDetailViewMode = EViewDetailMode.TASK;
  @Output() isFocusViewChecked = new EventEmitter<boolean>(false);
  public readonly EDataE2ENavHeader = EDataE2ENavHeader;
  public readonly EDataE2EInbox = EDataE2EInbox;
  public isChecked: boolean = true;
  public getTaskParams;
  public currentMailboxId: string;
  public tooltipTemplateFocusView: string =
    'Focused view shows only messages and tasks assigned to you from portfolios you follow.';
  public isDisabled = false;
  private destroy$ = new Subject<void>();
  public isConsole: boolean = false;
  readonly EViewDetailMode = EViewDetailMode;
  private currentUser: CurrentUser;
  public showPopover: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private agencyService: AgencyService,
    private mailboxSettingService: MailboxSettingService,
    private inboxFilterService: InboxFilterService,
    public sharedService: SharedService,
    private inboxService: InboxService,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private dashboardApiService: DashboardApiService,
    private splashScreenService: SplashScreenService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();

    this.mailboxSettingService.mailBoxId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mailboxId) => {
        this.currentMailboxId = mailboxId;
        this.getFocusStateLocalStorage(this.currentMailboxId);
        this.router.navigate([], {
          queryParams: {
            inboxType: this.isChecked ? GroupType.MY_TASK : GroupType.TEAM_TASK
          },
          queryParamsHandling: 'merge'
        });
      });

    this.inboxService.isAllFiltersDisabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDisabled) => {
        this.isDisabled = isDisabled;
        this.cdr.markForCheck();
      });
    this.activatedRoute.queryParams
      .pipe(
        takeUntil(this.destroy$),
        filter((params) => {
          const { status } = params;
          return ![TaskStatusType.mailfolder].includes(status);
        })
      )
      .subscribe((queryParams) => {
        if (queryParams) {
          this.getTaskParams = {
            type: queryParams[ETaskQueryParams.INBOXTYPE],
            status: queryParams[ETaskQueryParams.TASKSTATUS],
            topicId: queryParams[ETaskQueryParams.TASKTYPEID],
            page: 0,
            limit: LIMIT_TASK_LIST,
            mailBoxId: this.currentMailboxId
          };
          const isFocused =
            queryParams[ETaskQueryParams.INBOXTYPE] === GroupType.MY_TASK;
          this.isChecked = isFocused;
          this.setFocusStateLocalStorage(this.currentMailboxId);
          this.isFocusViewChecked.emit(isFocused);
        }
      });

    this.setDefaultFocusState();

    const userDetail$ = this.userService.getUserDetail();
    const visibleSplashScreen$ = this.splashScreenService.visible$;
    combineLatest([userDetail$, visibleSplashScreen$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([userDetail, visibleSplashScreen]) => {
        this.currentUser = userDetail;
        if (
          userDetail?.userOnboarding?.useDefaultFocusView &&
          !this.isConsole &&
          !visibleSplashScreen
        ) {
          this.showPopover = true;
        }
      });
  }

  getFocusStateLocalStorage(mailBoxId: string) {
    const focusState = localStorage.getItem(`mailbox-${mailBoxId}-focus`);
    this.isChecked = focusState ? focusState === 'true' : true;
    this.inboxFilterService.setSelectedInboxType(
      (this.isChecked ? GroupType.MY_TASK : GroupType.TEAM_TASK) as GroupType
    );
  }

  setFocusStateLocalStorage(mailBoxId: string) {
    localStorage.setItem(
      `mailbox-${mailBoxId}-focus`,
      this.isChecked as unknown as string
    );
  }

  setDefaultFocusState() {
    const params = this.activatedRoute.snapshot.queryParamMap;
    const inboxType = params.get('inboxType');
    const isFocused = inboxType === GroupType.MY_TASK;
    inboxType &&
      this.inboxFilterService.setSelectedInboxType(inboxType as GroupType);
    this.isChecked = isFocused;
  }

  onCheckboxChange(status: boolean): void {
    this.isChecked = status;
    if (!status) {
      this.updateUseDefaultFocusViewOfUser();
    }
    this.getTaskParams.type = status ? GroupType.MY_TASK : GroupType.TEAM_TASK;
    this.inboxFilterService.setSelectedInboxType(this.getTaskParams.type);
    this.isFocusViewChecked.emit(status);
    this.router.navigate([], {
      queryParams: { inboxType: this.getTaskParams.type, taskId: null },
      queryParamsHandling: 'merge'
    });
  }

  handleCheckBoxChange(event: Event): void {
    if (this.isDisabled) return;

    event.preventDefault();
    this.isChecked = !this.isChecked;
    this.inboxFilterService.setIsSelectedItemAssignee(this.isChecked);
    if (this.isChecked) {
      this.inboxFilterService.patchValueSelectedItem(
        'assignee',
        this.isConsole ? 0 : 1
      );
    }
    this.onCheckboxChange(this.isChecked);
  }

  updateUseDefaultFocusViewOfUser() {
    if (this.currentUser?.userOnboarding?.useDefaultFocusView) {
      this.userService.setUserDetail({
        ...this.currentUser,
        userOnboarding: {
          useDefaultFocusView: false
        }
      });
      this.dashboardApiService
        .updateOnboardingDefaultData({ useDefaultFocusView: false })
        .subscribe();
    }
  }

  toggleClose() {
    this.showPopover = false;
    this.updateUseDefaultFocusViewOfUser();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.showPopover = false;
    this.updateUseDefaultFocusViewOfUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
