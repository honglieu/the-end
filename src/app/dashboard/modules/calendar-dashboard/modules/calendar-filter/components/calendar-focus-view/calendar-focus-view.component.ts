import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupType } from '@shared/enum/user.enum';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { SharedService } from '@services/shared.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { UserService } from '@/app/dashboard/services/user.service';
import { CurrentUser } from '@shared/types/user.interface';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { SplashScreenService } from '@/app/splash-screen/splash-screen.service';
import { CalendarFilterService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-filter/services/calendar-filter.service';

@Component({
  selector: 'calendar-focus-view',
  templateUrl: './calendar-focus-view.component.html',
  styleUrls: ['./calendar-focus-view.component.scss']
})
export class CalendarFocusViewComponent implements OnInit, OnDestroy {
  @Input() taskDetailViewMode = EViewDetailMode.TASK;
  @Output() isFocusViewChecked = new EventEmitter<boolean>(false);
  public isChecked: boolean = true;
  public getTaskParams;
  public currentMailboxId: string;
  public tooltipTemplateFocusView: string =
    'Focused view shows only events from portfolios you follow.';
  public isDisabled = false;
  private destroy$ = new Subject<void>();
  readonly EViewDetailMode = EViewDetailMode;
  private currentUser: CurrentUser;
  public showPopover: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private mailboxSettingService: MailboxSettingService,
    public sharedService: SharedService,
    private userService: UserService,
    private dashboardApiService: DashboardApiService,
    private splashScreenService: SplashScreenService,
    private calendarFilterService: CalendarFilterService
  ) {}

  ngOnInit(): void {
    this.mailboxSettingService.mailBoxId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mailboxId) => (this.currentMailboxId = mailboxId));

    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((queryParams) => {
        if (queryParams) {
          this.getTaskParams = {
            calendarFocus: queryParams[ETaskQueryParams.CALENDAR_FOCUS]
          };
          const isFocused =
            queryParams[ETaskQueryParams.CALENDAR_FOCUS] === GroupType.MY_TASK;
          this.isChecked = isFocused;
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
          !visibleSplashScreen
        ) {
          this.showPopover = true;
        }
      });
  }

  setDefaultFocusState() {
    const params = this.activatedRoute.snapshot.queryParamMap;
    const calendarFocus = params.get(ETaskQueryParams.CALENDAR_FOCUS);
    const isFocused = calendarFocus === GroupType.MY_TASK;
    this.isChecked = isFocused;
  }

  onCheckboxChange(status: boolean): void {
    this.isChecked = status;
    if (!status) {
      this.updateUseDefaultFocusViewOfUser();
    }
    this.calendarFilterService.setEventId(null);
    this.getTaskParams.calendarFocus = status
      ? GroupType.MY_TASK
      : GroupType.TEAM_TASK;
    this.calendarFilterService.setFocusView(status);
    this.isFocusViewChecked.emit(status);
    this.router.navigate([], {
      queryParams: { calendarFocus: this.getTaskParams.calendarFocus },
      queryParamsHandling: 'merge'
    });
  }

  handleCheckBoxChange(event: Event): void {
    if (this.isDisabled) return;

    event.preventDefault();
    this.isChecked = !this.isChecked;
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
