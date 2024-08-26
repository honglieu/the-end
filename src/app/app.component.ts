import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription, fromEvent, merge, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  takeUntil
} from 'rxjs/operators';
import { ChatGptService } from '@services/chatGpt.service';
import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';
import { conversations } from 'src/environments/environment';
import { AgencyService } from './dashboard/services/agency.service';
import { AgencyService as AppAgencyService } from './services/agency.service';
import { ApiService } from './services/api.service';
import { DEBOUNCE_SOCKET_TIME } from './services/constants';
import { ElectronService } from './services/electron.service';
import { FirebaseService } from './services/firebase.service';
import { LoadingService } from './services/loading.service';
import { PropertiesService } from './services/properties.service';
import { RxWebsocketService } from './services/rx-websocket.service';
import { SharedService } from './services/shared.service';
import { ShowPanelService } from './services/showPanel.service';
import { UserService } from './services/user.service';
import { ModalPopupPosition } from './shared/components/modal-popup/modal-popup';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  public userId: string;
  public currentTab!: string;
  public showRightPanel = false;
  private unsubscribe = new Subject<void>();
  public openModal = false;
  isExpanded = false;
  isOpenSidebar: boolean = false;
  public popupModalPosition = ModalPopupPosition;
  public popupStatusUser = false;
  public titleStatusUser = "I can't locate your profile on Property Tree.";
  public messageStatusUser = 'This may mean your access has been revoked.';
  public subMessageStatusUser = 'Please contact your account administrator.';
  public isElectronApp: boolean;
  screenWidth: number;

  timeOut1: NodeJS.Timeout = null;
  networkStatus: boolean = false;
  isShowNotifyInternet: boolean = true;
  eventNetworkStatus: Subscription = Subscription.EMPTY;
  public hideHeader: boolean = true;

  constructor(
    public propertiesService: PropertiesService,
    private appAgencyService: AppAgencyService,
    private agencyService: AgencyService,
    private showPanelService: ShowPanelService,
    private router: Router,
    private firebaseService: FirebaseService,
    private apiService: ApiService,
    private readonly sharedService: SharedService,
    private route: ActivatedRoute,
    private userService: UserService,
    private electronService: ElectronService,
    private websocketService: RxWebsocketService,
    private loadingService: LoadingService,
    private toastService: ToastrService,
    private companyEmailSignatureService: CompanyEmailSignatureService,
    private agentUserService: AgentUserService,
    private chatGptService: ChatGptService
  ) {}

  ngOnInit() {
    // TODO: refactor code
    this.subscribeRouterEvent();
    this.getScreenSize();
    this.route.paramMap
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((paramMap) => {
        if (paramMap) {
          // get email signature
          this.companyEmailSignatureService
            .getEmailSignature()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe();

          // get enable suggestion ai
          this.chatGptService
            .getSetting()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe();

          this.agencyService.getListTopic();
        }
      });
    this.sharedService.rightSidebarCollapseState$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((e) => (this.isExpanded = e));
    this.sharedService.leftSidebarCollapseState$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((e) => (this.isOpenSidebar = e));
    this.showPanelService
      .getIsShowPanel()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.showRightPanel = res;
      });
    const isFirstLoading = localStorage.getItem('isFirstLoading');
    isFirstLoading
      ? this.loadingService.onLoading()
      : this.loadingService.onReLoading();
    this.propertiesService.init();

    if (!!localStorage.getItem('_idToken')) {
      if (!localStorage.getItem('listCategoryTypes')) {
        this.apiService
          .getAPI(conversations, 'list')
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((res) => {
            if (res && res.list) {
              localStorage.setItem(
                'listCategoryTypes',
                JSON.stringify(res.list)
              );
            }
          });
      }
    }
    this.checkNetworkStatus();
    this.subScribeUserInfo();
    this.subscribeToSocketBulkMail();
  }

  subScribeUserInfo() {
    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.timeOut1 && clearTimeout(this.timeOut1);
        this.timeOut1 = setTimeout(() => {
          this.popupStatusUser = this.userService.pmPortalIsDeleted;
        }, 500);
      });
  }

  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    this.screenWidth = window.innerWidth;
  }

  onHandleOpen(open: boolean) {
    this.showPanelService.setIsShowPanel(open);
  }

  handleCloseNotify(status: boolean) {
    this.isShowNotifyInternet = status;
  }

  onCollapse() {
    this.isExpanded = !this.isExpanded;
    this.sharedService.rightSidebarCollapseState$.next(this.isExpanded);
  }

  handleClosePopupStatusUser() {
    this.popupStatusUser = false;
  }

  handleDbClickOpenMenu() {
    if (this.screenWidth < 1127 || this.screenWidth > 1301) return;
    this.isOpenSidebar = !this.isOpenSidebar;
    this.sharedService.leftSidebarCollapseState$.next(this.isOpenSidebar);
  }

  handleClickCloseMenu() {
    if (this.screenWidth < 1127 || this.screenWidth > 1301) return;
    this.sharedService.leftSidebarCollapseState$.next(false);
  }

  checkNetworkStatus() {
    this.networkStatus = navigator.onLine;
    this.isElectronApp = this.electronService.checkElectronApp();

    this.eventNetworkStatus = merge(
      of(null),
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    )
      .pipe(map(() => navigator.onLine))
      .subscribe((status) => {
        this.networkStatus = status;
      });
  }

  subscribeToSocketBulkMail() {
    this.websocketService.onSocketBulkEmail
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe)
      )
      .subscribe((rs) => {
        if (rs?.message) {
          if (this.router.url.includes('tenants-landlords')) {
            this.agentUserService.reloadTenantLandlordData.next(true);
          }
        }
        this.toastService.success(rs?.message);
      });
  }

  subscribeRouterEvent() {
    this.hideHeader = !window.location.href.includes('/detail/');
    this.router.events.pipe(takeUntil(this.unsubscribe)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.hideHeader = event.url.includes('/detail/') ? false : true;
      }
    });
  }

  ngOnDestroy() {
    clearTimeout(this.timeOut1);
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.isShowNotifyInternet = true;
    this.propertiesService.destroy();
  }
}
