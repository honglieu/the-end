import { SharedService } from '@services/shared.service';
import { GroupType } from '@shared/enum/user.enum';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { CurrentUser } from '@shared/types/user.interface';
import { UserService } from '@/app/dashboard/services/user.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { HelperService } from '@services/helper.service';
import { CalendarFilterService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-filter/services/calendar-filter.service';
@Component({
  selector: 'header-focus-view',
  templateUrl: './header-focus-view.component.html',
  styleUrl: './header-focus-view.component.scss'
})
export class HeaderFocusViewComponent implements OnInit, OnDestroy {
  @ViewChild(CdkOverlayOrigin) trigger: CdkOverlayOrigin;
  private unsubscribe = new Subject<void>();
  public showPopup: boolean = false;
  public isChecked: boolean = true;
  public isDisabled = false;
  public currentMailboxId: string;
  public isConsole: boolean = false;
  private currentUser: CurrentUser;
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private inboxFilterService: InboxFilterService,
    public readonly sharedService: SharedService,
    private mailboxSettingService: MailboxSettingService,
    private dashboardApiService: DashboardApiService,
    private helperService: HelperService,
    private calendarFilterService: CalendarFilterService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();

    this.userService
      .getUserDetail()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.currentUser = res;
      });

    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((queryParams) => {
        if (
          queryParams &&
          Object.keys(queryParams)?.length > 0 &&
          (queryParams[ETaskQueryParams.INBOXTYPE] ||
            queryParams[ETaskQueryParams.CALENDAR_FOCUS])
        ) {
          const isFocused =
            queryParams[ETaskQueryParams.INBOXTYPE] === GroupType.MY_TASK ||
            queryParams[ETaskQueryParams.CALENDAR_FOCUS] === GroupType.MY_TASK;
          this.isChecked = isFocused;
          this.inboxFilterService.setIsFilterDisabled(this.isChecked);
          const params = this.isChecked
            ? GroupType.MY_TASK
            : GroupType.TEAM_TASK;
          this.calendarFilterService.setFocusView(this.isChecked);
          this.setFocusStateLocalStorage();
          this.inboxFilterService.setSelectedInboxType(params as GroupType);
          this.cdr.detectChanges(); // can not use markForCheck, do not remove it.
        }
      });
    this.inboxFilterService.triggerTurnOffFocusView$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (rs) {
          if (this.currentUser?.userOnboarding?.useDefaultFocusView) {
            this.isChecked = false;
            this.updateUseDefaultFocusViewOfUser();
            this.router.navigate([], {
              relativeTo: this.activatedRoute,
              queryParams: {
                inboxType: GroupType.TEAM_TASK
              },
              queryParamsHandling: 'merge'
            });
            return;
          }
          this.isChecked = false;
          this.inboxFilterService.setSelectedInboxType(GroupType.TEAM_TASK);
          this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: {
              inboxType: GroupType.TEAM_TASK
            },
            queryParamsHandling: 'merge'
          });
        }
      });
  }

  getFocusStateLocalStorage() {
    const focusState = localStorage.getItem(`mailbox-focus`);
    if (focusState) {
      this.isChecked = focusState === 'true';
    }
    this.inboxFilterService.setSelectedInboxType(
      (this.isChecked ? GroupType.MY_TASK : GroupType.TEAM_TASK) as GroupType
    );
  }

  setFocusStateLocalStorage() {
    localStorage.setItem(`mailbox-focus`, this.isChecked as unknown as string);
  }

  onFocusView() {
    this.showPopup = !this.showPopup;
  }

  onCheckboxChange(status: boolean): void {
    this.isChecked = status;
    if (!status) {
      this.updateUseDefaultFocusViewOfUser();
    }

    this.inboxFilterService.setIsSelectedItemAssignee(this.isChecked);
    if (this.isChecked) {
      this.inboxFilterService.patchValueSelectedItem(
        'assignee',
        this.isConsole ? 0 : 1
      );
    }
    const paramType = status ? GroupType.MY_TASK : GroupType.TEAM_TASK;
    this.inboxFilterService.setSelectedInboxType(paramType);
    this.inboxFilterService.setIsFilterDisabled(status);
    this.calendarFilterService.setFocusView(status);
    this.setFocusStateLocalStorage();
    let queryParams = {};
    if (
      this.helperService.isDashboardInbox ||
      this.helperService.isDashboardTask
    ) {
      queryParams = {
        inboxType: paramType,
        taskId: null,
        conversationId: null
      };
    }
    if (this.helperService.isDashboardEvent) {
      this.calendarFilterService.setEventId(null);
      queryParams = { calendarFocus: paramType };
    }
    this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge'
    });
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

  overlayOutsideClick(event: MouseEvent) {
    const buttonElement = this.trigger.elementRef.nativeElement as HTMLElement;
    const targetElement = event.target as HTMLElement;
    if (!buttonElement.contains(targetElement)) {
      this.showPopup = false;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
