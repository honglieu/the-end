import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConversationService } from '@services/conversation.service';
import { filter, map } from 'rxjs/operators';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { FilesService } from '@services/files.service';
import { SharedService } from '@services/shared.service';
import { DEFAULT_TEXT_MESS_HEIGHT } from '@services/constants';
import { ElectronService } from './services/electron.service';
import { GET_CURRENT_APP_VERSION } from 'src/helpers/electron/constants';
import { Title } from '@angular/platform-browser';
import queryString from 'query-string';
import { Subject, fromEvent, merge, of } from 'rxjs';
import { SplashScreenService } from './splash-screen/splash-screen.service';
@Component({
  selector: 'app-start',
  templateUrl: './main.html'
})
export class MainComponent implements OnInit, OnDestroy {
  previousURL = '';
  currentURL = '';

  public showRefreshAppPopUp: boolean = false;
  public showUpdateVersionApp: boolean = false;
  public electronApp: boolean = false;
  public visibleSplashScreen$ = this.splashScreenService.visible$;
  private unsubscribe = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly conversationService: ConversationService,
    private readonly fileService: FilesService,
    private readonly sharedService: SharedService,
    private readonly electronService: ElectronService,
    private readonly titleService: Title,
    private readonly activeRoute: ActivatedRoute,
    private readonly splashScreenService: SplashScreenService
  ) {
    this.electronApp = this.electronService.isElectronApp;
  }

  get isNoInternet() {
    return this.router.url.includes('no-internet');
  }

  ngOnInit(): void {
    const isPortal = window.location.href.includes('portal');
    this.titleService.setTitle(isPortal ? 'Trudi®' : 'Console');
    if (this.electronApp) {
      this.handlElectronEventListeners();
    }
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.previousURL = this.currentURL;
        this.currentURL = event.url;
        const DASHBOARD = 'dashboard/',
          ACTION_LINK = 'send-action-link/';
        if (
          (this.currentURL.includes(DASHBOARD) &&
            this.previousURL.includes(ACTION_LINK)) ||
          (this.previousURL.includes(DASHBOARD) &&
            this.currentURL.includes(ACTION_LINK))
        ) {
        } else {
          this.fileService.fileList.next([]);
          this.conversationService.actionLinkList.next([]);
          this.conversationService._actionLinkList = [];
          this.sharedService.textContainerHeight.next(DEFAULT_TEXT_MESS_HEIGHT);
        }
      });

    this.activeRoute.queryParamMap
      .pipe(
        filter((queryParamMap) => queryParamMap.has('portalDesktopProtocol'))
      )
      .subscribe((queryParamMap) => {
        const appProtocol = queryParamMap.get('portalDesktopProtocol');
        const curentUrl = window.location.href;
        const appUrl = [
          appProtocol,
          '://',
          encodeURIComponent(
            queryString.exclude(curentUrl, ['portalDesktopProtocol'])
          )
        ].join('');
        window.location.href = appUrl;

        this.router.navigate([], {
          queryParams: {
            portalDesktopProtocol: null
          },
          queryParamsHandling: 'merge'
        });
      });
    this.subscribeNetworkApp();
  }

  handlElectronEventListeners() {
    if (!this.electronService.ipcRenderer.invoke) {
      this.showUpdateVersionApp = true;
    } else {
      this.electronService.ipcRenderer
        .invoke(GET_CURRENT_APP_VERSION)
        .then((version) => {
          if (!version) return;
          this.electronService
            .checkDesktopVersionStore(version)
            .subscribe((res) => {
              if (!res) return;
              this.showUpdateVersionApp = res.isOutOfDateApp;
            });
        });
    }
  }

  subscribeNetworkApp() {
    merge(of(null), fromEvent(window, 'online'), fromEvent(window, 'offline'))
      .pipe(map(() => navigator.onLine))
      .subscribe((status) => {
        if (!status && !this.router.url.includes('inbox/detail')) {
          this.showRefreshAppPopUp = false;
          this.router.navigate(['/no-internet']);
        }
      });
  }

  handleShowRefreshAppPopup(show: boolean) {
    this.showRefreshAppPopUp = show;
    this.sharedService.setShowPopupNotifyNewVersion({
      isShowPopup: show,
      heighPopup: 0
    });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
