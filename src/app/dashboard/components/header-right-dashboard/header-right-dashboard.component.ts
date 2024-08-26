import { HelpCentreService } from '@services/help-centre.service';
import { SharedService } from '@services/shared.service';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import {
  Observable,
  Subject,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  takeUntil
} from 'rxjs';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { CurrentUser } from '@shared/types/user.interface';
import { displayName } from '@shared/feature/function.feature';
import { UserTypeEnum } from '@shared/enum';
import { UserService } from '@/app/dashboard/services/user.service';
import { CompanyService } from '@services/company.service';
import { ICompany } from '@shared/types/company.interface';
import { PromotionsService } from '@/app/console-setting/promotions/services/promotions.service';
import { TaskService } from '@services/task.service';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { NotificationService } from '@services/notification.service';
import { COUNT_UNREAD_MESSAGE } from 'src/helpers/electron/constants';
import { Router } from '@angular/router';
import { ElectronService } from '@services/electron.service';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { PromotionsApiService } from '@/app/console-setting/promotions/services/promotions-api.service';
import { Auth0Service } from '@services/auth0.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { DEBOUNCE_SOCKET_TIME } from '@/app/dashboard/utils/constants';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { CalendarFilterService } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-filter/services/calendar-filter.service';
import { EDataE2ENavHeader } from '@shared/enum/E2E.enum';
import { PreventButtonService } from '@trudi-ui';
import { EButtonCommonKey, EButtonType } from '@trudi-ui';
import { EMenuDropdownType } from '@shared/directives/menuKeyboard.directive';

@Component({
  selector: 'header-right-dashboard',
  templateUrl: './header-right-dashboard.component.html',
  styleUrls: ['./header-right-dashboard.component.scss']
})
export class HeaderRightDashboardComponent implements OnInit {
  @Input() currentCompanyId: string;

  public readonly EDataE2ENavHeader = EDataE2ENavHeader;
  public UserTypeEnum = UserTypeEnum;
  public currentUser: CurrentUser;
  public isUnreadInbox$: Observable<boolean>;
  public currentTaskId: string;
  public promotionId: string = '';
  public listCompany: ICompany[];
  public openHelpCentreLink = true;
  public avatarPopupVisible: boolean = false;
  unreadCount: number = 0;
  isShowNotification: boolean = false;
  private destroy$ = new Subject();
  public EButtonCommonKey = EButtonCommonKey;
  public EButtonType = EButtonType;
  public isProcessStep: boolean = false;
  public EMenuDropdownType = EMenuDropdownType;

  constructor(
    private inboxFilterService: InboxFilterService,
    private userService: UserService,
    private agencyDashboardService: AgencyDashboardService,
    private auth0Service: Auth0Service,
    private statisticService: StatisticService,
    private notificationService: NotificationService,
    public rxWebSocketService: RxWebsocketService,
    private cdRef: ChangeDetectorRef,
    private dashboardService: DashboardApiService,
    private taskService: TaskService,
    private sharedService: SharedService,
    private router: Router,
    public helpCentreService: HelpCentreService,
    private calendarFilterService: CalendarFilterService,
    private promotionsService: PromotionsService,
    private promotionApiService: PromotionsApiService,
    private electronService: ElectronService,
    private companyService: CompanyService,
    private PreventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    this.promotionsService
      .getPromotionId()
      .pipe(
        takeUntil(this.destroy$),
        filter((id) => Boolean(id))
      )
      .subscribe((id) => {
        this.promotionId = id;
      });

    this.taskService.currentTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.currentTaskId = res?.id || null;
      });

    this.subscribeToSocketNoti();

    this.userService
      .getUserDetail()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.currentUser = res;
        this.sharedService.userType = res?.type;
        this.cdRef.detectChanges();
      });

    this.companyService
      .getCompanies()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.listCompany = res?.sort((a, b) => a?.name.localeCompare(b?.name));
      });

    this.isUnreadInbox$ = this.statisticService.getStatisticUnreadInbox().pipe(
      takeUntil(this.destroy$),
      map((res) => (res ? Object.values(res).some((value) => !!value) : false))
    );

    this.subscribeReloadNotiList();

    window.zESettings = {
      webWidget: {
        zIndex: 999,
        offset: { horizontal: '45px', vertical: '36px' },
        position: { horizontal: 'right', vertical: 'top' },
        authenticate: {
          jwtFn: (callback) => {
            this.dashboardService
              .getSSOZendeskWidget()
              .pipe(takeUntil(this.destroy$))
              .subscribe((res) => {
                callback(res.token);
              });
          }
        },
        helpCenter: {
          originalArticleButton: true
        }
      }
    };

    const script = document.createElement('script');
    script.defer = true;
    script.id = 'ze-snippet';
    script.src =
      'https://static.zdassets.com/ekr/snippet.js?key=2c626d48-aba4-4e70-bda5-e6f088f2d042';
    script.addEventListener('load', () => {
      window.zE(function () {
        window.zE.hide();
        window.zE.setLocale('en-au');
      });

      window.zE('webWidget:on', 'close', () => {
        this.helpCentreService.handleCloseZendeskWidget();
      });
    });
    document.body.appendChild(script);

    this.onTriggerChangeProcess();
  }

  onTriggerChangeProcess() {
    this.PreventButtonService.triggerChangeProcess$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.isProcessStep = !this.PreventButtonService.shouldHandleProcess(
          EButtonCommonKey.SWITCH_ACCOUNT,
          EButtonType.COMMON,
          false
        );
      });
  }

  get isConsole() {
    return this.sharedService.isConsoleUsers();
  }

  get isLead() {
    return this.currentUser?.type === UserTypeEnum.LEAD;
  }

  get isShowHelpCentre$(): Observable<boolean> {
    return this.helpCentreService.getIsShowHelpCentre();
  }

  handleClickOnHeaderItem() {
    this.helpCentreService.handleCloseZendeskWidget();
  }

  goToConsoleSetting() {
    this.router.navigateByUrl('/dashboard/console-settings');
  }

  goToProfileSetting() {
    this.router.navigateByUrl('/dashboard/profile-setting');
  }

  subscribeReloadNotiList() {
    this.notificationService.reloadNotiList
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.notificationService.getNotificationUnreadCount().subscribe();
      });

    this.notificationService.unreadCount
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.unreadCount = res;
        this.cdRef.detectChanges();
      });
  }

  subscribeToSocketNoti() {
    this.rxWebSocketService.onSocketNotification
      .pipe(
        distinctUntilChanged(),
        debounceTime(DEBOUNCE_SOCKET_TIME),
        takeUntil(this.destroy$)
      )
      .subscribe((rs) => {
        this.notificationService.getNotificationUnreadCount().subscribe();
      });
  }

  handleNavigateToPrivacyPolicy() {
    window.open('https://legal.trudi.ai/', '_blank');
  }

  handleLogout() {
    if (this.promotionId) {
      this.promotionApiService.closePromotion(this.promotionId).subscribe();
    }
    this.handleResetBadgeAppElectron();
    this.helpCentreService.handleCloseZendeskWidget();
    this.auth0Service.handleLogout();
  }

  handleResetBadgeAppElectron() {
    if (this.electronService.checkElectronApp()) {
      this.electronService.ipcRenderer.send(COUNT_UNREAD_MESSAGE, 0);
    }
  }

  handleSwitchAgency(company: ICompany) {
    this.helpCentreService.handleCloseZendeskWidget();
    this.agencyDashboardService.handleChangeCurrentCompany(
      company.id,
      () => {
        if (this.currentTaskId) {
          this.router.navigate(['/dashboard']);
        }
      },
      company
    );
    this.handleClearService();
  }

  handleClearService() {
    this.inboxFilterService.setSearchDashboard(null);
    this.inboxFilterService.setSelectedAgency(null);
    this.inboxFilterService.setSelectedPortfolio([]);
    this.calendarFilterService.setPortfolioSelected([]);
    this.calendarFilterService.setEventTypeSelected(null);
    this.calendarFilterService.setSelectedAgencies([]);
    this.cdRef.markForCheck();
  }

  handleOpenNotification(): void {
    this.helpCentreService.handleCloseZendeskWidget();
    this.notificationService.handleOpenNotification();
  }

  get isShowNotification$(): Observable<boolean> {
    return this.notificationService.getIsShowNotification();
  }

  handleClickOutside(event) {
    const helpCenter = document.getElementById('help-center') as HTMLElement;

    if (
      this.helpCentreService.getValueIsShowHelpCentre() &&
      !helpCenter.contains(event.target)
    ) {
      this.helpCentreService.handleCloseZendeskWidget();
    }
  }

  showHelpCenter(e) {
    e.stopPropagation();
    this.helpCentreService.setShowHelpCentre(true);
    if (this.openHelpCentreLink) {
      this.openHelpCentreLink = false;
      this.dashboardService
        .getSSOZendesk()
        .pipe(takeUntil(this.destroy$))
        .subscribe((zendesk) => {
          const isUsPortal =
            window.location.href.includes('us.portal.trudi.ai');
          const helpCentreLink = isUsPortal
            ? zendesk.redirectUrl.replace('en-au', 'en-us')
            : zendesk.redirectUrl;
          window.open(helpCentreLink, '_blank');
        });
    }
    const helpCenter = document.getElementById('help-center') as HTMLElement;
    if (
      document
        .getElementById('help-center')
        ?.children[0]?.classList?.contains('help-center-item')
    ) {
      this.helpCentreService.handleCloseZendeskWidget();
    } else {
      if (window.zE) {
        window.zE('webWidget', 'prefill', {
          name: {
            value: displayName(
              this.currentUser.firstName,
              this.currentUser.lastName
            )
          },
          email: {
            value: this.currentUser.email
          }
        });

        window.zE('webWidget:on', 'close', () => {
          this.cdRef.detectChanges();
        });

        helpCenter.children[0].classList.add('help-center-item');
      }
      window.zE?.activate();
    }
  }

  handleVisibleChange(visible: boolean) {
    this.avatarPopupVisible = visible;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
