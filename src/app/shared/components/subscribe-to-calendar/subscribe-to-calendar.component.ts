import { animate, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { CompanyService } from '@services/company.service';
import { SharedService } from '@services/shared.service';

const NOTE_ZONE_TRANSITION = '.25s';

export enum ESubscribe {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  APPLE = 'apple'
}

export enum ESubscribeCalendar {
  INLINE = 'inline',
  NOTIFICATION = 'notification'
}

@Component({
  selector: 'subscribe-to-calendar',
  templateUrl: './subscribe-to-calendar.component.html',
  styleUrls: ['./subscribe-to-calendar.component.scss'],
  animations: [
    trigger('toTopFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate(
          NOTE_ZONE_TRANSITION,
          style({ opacity: 1, transform: 'translateY(8px)' })
        )
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateY(8px)' }),
        animate(
          NOTE_ZONE_TRANSITION,
          style({ opacity: 0, transform: 'translateY(-10px)' })
        )
      ])
    ]),
    trigger('collapse', [
      transition(':enter', [
        style({ height: '0' }),
        animate(NOTE_ZONE_TRANSITION, style({ height: '108px' }))
      ]),
      transition(':leave', [
        style({ height: '108px' }),
        animate(NOTE_ZONE_TRANSITION, style({ height: '0' }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('0.25s', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.25s', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscribeToCalendarComponent implements OnInit, OnDestroy {
  @Input() viewMode: ESubscribeCalendar = ESubscribeCalendar.INLINE;

  public placement: 'bottomRight' | 'leftTop' = 'bottomRight';
  public isOpenPopup: boolean = false;
  public isConsole: boolean;
  public loadingState: {
    isGoogleLoading: boolean;
    isOutlookLoading: boolean;
    isIcloudLoading: boolean;
  } = {
    isGoogleLoading: false,
    isOutlookLoading: false,
    isIcloudLoading: false
  };
  public isRmEnvironment: boolean = false;

  private destroy$ = new Subject<void>();

  public readonly ESubscribe = ESubscribe;
  public readonly ESubscribeCalendar = ESubscribeCalendar;

  constructor(
    private dashboardApiService: DashboardApiService,
    private agencyService: AgencyService,
    private sharedService: SharedService,
    private cdrRef: ChangeDetectorRef,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });
    this.getCalendarUserSetting();
  }

  getCalendarUserSetting(): void {
    if (this.viewMode !== ESubscribeCalendar.NOTIFICATION) return;
    this.dashboardApiService.getCalendarDataApi().subscribe({
      next: (res) => {
        this.isOpenPopup = !res || !res.lastCloseBannerCalendar;
        this.cdrRef.markForCheck();
      }
    });
  }

  handleClosePopup() {
    this.dashboardApiService
      .closePopupCalendar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isOpenPopup = false;
          this.cdrRef.markForCheck();
        }
      });
  }

  handleSubscribe(state: ESubscribe) {
    this.updateLoadingState(state, true);

    this.dashboardApiService
      .generateIcsLink()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.handleClosePopup();
          if (res.url) {
            this.openCalendarWindow(state, res.url);
            this.updateLoadingState(state, false);
            this.cdrRef.markForCheck();
          }
        },
        error: (_) => {
          this.updateLoadingState(state, false);
          this.cdrRef.markForCheck();
        }
      });
  }

  private updateLoadingState(state: ESubscribe, isLoading: boolean) {
    switch (state) {
      case ESubscribe.GOOGLE:
        this.loadingState.isGoogleLoading = isLoading;
        break;
      case ESubscribe.OUTLOOK:
        this.loadingState.isOutlookLoading = isLoading;
        break;
      case ESubscribe.APPLE:
        this.loadingState.isIcloudLoading = isLoading;
        break;
    }
  }

  private openCalendarWindow(state: ESubscribe, url: string) {
    switch (state) {
      case ESubscribe.GOOGLE: {
        window.open(
          `https://calendar.google.com/calendar/u/0/r?cid=${this.modifyUrlScheme(
            url
          )}`,
          '_blank'
        );
        break;
      }
      case ESubscribe.OUTLOOK: {
        window.open(
          `https://outlook.live.com/calendar/0/addfromweb?url=${url}&name=Trudi%C2%AE%20calendar&mkt=en-001`,
          '_blank'
        );
        break;
      }
      case ESubscribe.APPLE: {
        window.open(`webcal://${url.replace('https://', '')}`, '_blank');
        break;
      }
    }
  }

  private modifyUrlScheme(url) {
    let modifiedUrl = url;

    if (url.startsWith('https://')) {
      modifiedUrl = 'http://' + url.substring(8);
    }

    return modifiedUrl + `?timestamp=${new Date().getTime()}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
