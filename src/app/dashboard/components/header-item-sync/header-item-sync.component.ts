import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Subject, combineLatest, firstValueFrom, takeUntil } from 'rxjs';
import { debounceTime, first, tap } from 'rxjs/operators';
import { ApiService } from '@services/api.service';
import { TIME_FORMAT } from '@services/constants';
import { PropertiesService } from '@services/properties.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SocketType } from '@shared/enum/socket.enum';
import { syncs } from 'src/environments/environment';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import {
  FlagTypeSync,
  IconsSync,
  StatusSync,
  ISubscriptionsList,
  ValueTypeSync,
  TitleTooltip,
  DetailTooltip
} from '@/app/dashboard/shared/types/sidebar.interface';
import { CompanyService } from '@services/company.service';
import { PortfolioService } from '@/app/dashboard/services/portfolio.service';
import { IPortfoliosGroups } from '@/app/profile-setting/portfolios/interfaces/portfolios.interface';
import { CdkOverlayOrigin, Overlay } from '@angular/cdk/overlay';
import * as Utils from '@/app/dashboard/utils/utils';
import dayjs from 'dayjs';
import { EActionSyncType } from '@shared/enum/E2E.enum';
import { SharedService } from '@services/shared.service';
import { AiPolicyService } from '@/app/dashboard/services/ai-policy.service';

@Component({
  selector: 'header-item-sync',
  templateUrl: './header-item-sync.component.html',
  styleUrls: ['./header-item-sync.component.scss']
})
export class HeaderItemSyncComponent implements OnInit, OnDestroy {
  @ViewChild(CdkOverlayOrigin) trigger: CdkOverlayOrigin;
  public typeSync: FlagTypeSync = FlagTypeSync.SYNC_ABLE;
  public titleTooltip: TitleTooltip = { hover: null, click: null };
  public preTitleTooltip: DetailTooltip | null = null;
  public currentAgencyId: string;
  private intervalId!: ReturnType<typeof setInterval>;
  public title = '';
  public className = '';
  public iconName = '';
  public firstLoadingStatus = false;
  public isRmEnvironment: Boolean = false;
  public responseStatusSync: ISubscriptionsList;
  public TIME_ABLE_TO_SYNC = 1;
  public iconsSync = Object.values(IconsSync);
  public showSubscription = false;
  public subscriptionsList: ISubscriptionsList[] = [];
  public subscriptions: ISubscriptionsList[] = [];
  private unsubscribe = new Subject<void>();
  public lastTimeSynced: string;
  public lastTimeSyncCompleteFormatted: string;
  public lastCompleteSubscription: ISubscriptionsList;
  public portfoliosGroups: IPortfoliosGroups[];
  public isDropdownSync: boolean = false;
  private timeoutRef: NodeJS.Timeout = null;
  readonly FlagTypeSync = FlagTypeSync;
  readonly EActionSyncType = EActionSyncType;
  public StatusSync = StatusSync;
  public originalSubscriptionsList: ISubscriptionsList[];
  public isConsole: boolean;

  constructor(
    private apiService: ApiService,
    private websocketService: RxWebsocketService,
    private propertyService: PropertiesService,
    private agencyDashboardService: AgencyDashboardService,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService,
    private portfolioService: PortfolioService,
    private overlay: Overlay,
    private cdr: ChangeDetectorRef,
    public readonly sharedService: SharedService,
    private aiPolicyService: AiPolicyService
  ) {}

  ngOnInit(): void {
    this.firstLoadingStatus = true;
    this.isConsole = this.sharedService.isConsoleUsers();
    this.getSubscriptionsList();
    this.onSubscriptionSync();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.getSubscriptionsList();
        this.isRmEnvironment =
          this.agencyDashboardService.isRentManagerCRM(company);
      });
  }
  onSubscriptionSync() {
    this.websocketService.onSocketSync
      .pipe(debounceTime(300), takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (
          res &&
          (res.type === SocketType.sync || res.params?.type === SocketType.sync)
        ) {
          this.propertyService.getProperties(res?.companyId, false);
          this.getAllTags();
          this.getSubscriptionsList();
        }
      });
  }

  getAllTags() {
    this.aiPolicyService
      .getAllTag()
      .pipe(tap((tags) => this.aiPolicyService.setTags(tags)))
      .subscribe();
  }

  formatSyncRes(res: ISubscriptionsList) {
    const isEnableSync =
      res?.isEnableSync && res?.lastStatusSync === StatusSync.COMPLETE;
    if (isEnableSync) {
      this.willDoWithTypeSync(FlagTypeSync.SYNC_ABLE, res);
      return;
    }
    switch (res?.lastStatusSync) {
      case StatusSync.COMPLETE:
        this.willDoWithTypeSync(FlagTypeSync.SYNC_SUCCESS, res);
        break;
      case StatusSync.FAIL:
        this.willDoWithTypeSync(FlagTypeSync.SYNC_FAIL, res);
        break;
      case StatusSync.INPROGRESS:
        this.willDoWithTypeSync(FlagTypeSync.SYNCING, res);
        break;
      case StatusSync.PENDING:
        this.willDoWithTypeSync(FlagTypeSync.SYNCING, res);
        break;
      default:
        this.willDoWithTypeSync(FlagTypeSync.SYNC_ABLE, res);
        break;
    }
  }

  getSubscriptionsList() {
    combineLatest([
      this.portfolioService.getPortfolios$(),
      this.companyService.getStatusSyncAgenciesByCompanyId()
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        async ([portfolios, subscriptions]: [
          IPortfoliosGroups[],
          ISubscriptionsList[]
        ]) => {
          if (!subscriptions?.length) return;
          this.originalSubscriptionsList = subscriptions;
          this.subscriptionsList = subscriptions;
          if (!this.isConsole) {
            this.portfoliosGroups = portfolios;
            const followedSubscriptions: ISubscriptionsList[] = [];
            for (const subscription of subscriptions) {
              const portfoliosGroup = this.portfoliosGroups.find(
                (group) => group.id === subscription.agencyId
              );
              if (portfoliosGroup) {
                const followedPortfolios = portfoliosGroup.portfolios.filter(
                  (portfolio) => portfolio.isFollowed
                );
                if (followedPortfolios.length >= 1) {
                  followedSubscriptions.push(subscription);
                }
              }
            }
            this.subscriptionsList = followedSubscriptions;
          }
          this.subscriptionsList.sort((a, b) =>
            a.subscriptionName.localeCompare(b.subscriptionName)
          );
          const latestSyncedSubscription = this.getLatestSyncedSubscription(
            this.originalSubscriptionsList
          );
          this.lastCompleteSubscription =
            this.getLastSyncedCompleteSubscription();
          this.responseStatusSync = latestSyncedSubscription;
          this.lastTimeSynced =
            this.lastCompleteSubscription?.lastTimeSyncComplete;
          this.lastTimeSyncCompleteFormatted = await this.formatDate(
            this.lastTimeSynced
          );

          this.formatSyncRes(this.responseStatusSync);
          this.firstLoadingStatus = false;
          this.mapSubscriptionsList();
          this.formatSubscriptionsList(this.originalSubscriptionsList);
          this.formatSubscriptionsList(this.subscriptionsList);
          const statusSync = [StatusSync.INPROGRESS, StatusSync.PENDING];
          const existedSyncInprogress = this.originalSubscriptionsList.some(
            (item) => statusSync.includes(item.lastStatusSync)
          );
          if (existedSyncInprogress) {
            await this.willDoWithTypeSync(
              FlagTypeSync.SYNCING,
              this.lastCompleteSubscription
            );
          } else if (!this.responseStatusSync.lastStatusSync) {
            await this.willDoWithTypeSync(
              FlagTypeSync.SYNC_ABLE,
              this.responseStatusSync
            );
          }
        }
      );
    this.cdr.markForCheck();
  }

  async formatSubscriptionsList(subscriptionsList) {
    return subscriptionsList.map(async (subscription) => {
      const lastSyncItemFormated = await this.formatDate(
        subscription.lastTimeSync
      );
      const lastSyncFormated = await this.formatDate(
        subscription.lastTimeSyncComplete
      );
      subscription.lastTimeSyncCompleteFormatted = lastSyncFormated;
      subscription.lastTimeSyncFormatted = lastSyncItemFormated;
    });
  }

  async willDoWithTypeSync(type: FlagTypeSync, res: ISubscriptionsList) {
    this.typeSync = type;
    this.mapWithTypeSync(type, res);
    this.cdr.markForCheck();
  }

  mapWithTypeSync(type: FlagTypeSync, res?: ISubscriptionsList) {
    switch (type) {
      case FlagTypeSync.SYNCING:
        this.setValueTypeSync({
          title: 'syncing',
          className: 'syncing',
          iconName: IconsSync.SYNCING
        });
        break;
      case FlagTypeSync.SYNC_ABLE:
        this.setValueTypeSync({
          title: 'sync',
          className: 'sync',
          iconName: IconsSync.SYNC_DOWNWARD
        });
        break;
      case FlagTypeSync.SYNC_FAIL:
        this.setValueTypeSync({
          title: 'sync fail',
          className: 'sync-fail',
          iconName: IconsSync.SYNC_FAIL
        });
        break;
      case FlagTypeSync.SYNC_SUCCESS:
        res.iconName = IconsSync.SYNC_SUCCESS;
        this.setValueTypeSync({
          title: 'synced',
          className: 'synced',
          iconName: IconsSync.SYNC_SUCCESS
        });
        break;
    }
  }

  async formatDate(date) {
    if (!date) return '';
    const dataFormat = await firstValueFrom(
      this.agencyDateFormatService.dateFormatDayJS$.pipe(first(Boolean))
    );
    return this.agencyDateFormatService
      .agencyDayJs(date)
      .format(dataFormat ? dataFormat + ' ' + TIME_FORMAT : TIME_FORMAT);
  }

  async onSync(agencyId: string) {
    const dontSync = [FlagTypeSync.SYNCING].includes(this.typeSync);
    if (dontSync) return;
    if (this.typeSync !== FlagTypeSync.SYNC_SUCCESS) {
      await this.willDoWithTypeSync(
        FlagTypeSync.SYNCING,
        this.responseStatusSync
      );
      this.subscriptionsList = this.subscriptionsList.map((item) => {
        if (item.agencyId === agencyId) {
          return {
            ...item,
            className: 'syncing',
            iconName: IconsSync.SYNCING,
            lastStatusSync: StatusSync.PENDING
          };
        } else {
          return {
            ...item,
            className: null,
            disabled: true,
            iconName: IconsSync.SYNC_DISABLED,
            lastStatusSync: null
          };
        }
      });
    }
    this.apiService
      .getAPI(syncs, 'sync-properties-tree', {
        agencyId: agencyId
      })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => {
          this.getSubscriptionsList();
        },
        error: (err) => {
          if (
            this.typeSync === FlagTypeSync.SYNC_SUCCESS &&
            err?.error?.message.startsWith('You')
          ) {
            // You have exceeded your number of syncs for this hour.
            // can handle after
          } else {
            this.willDoWithTypeSync(
              FlagTypeSync.SYNC_FAIL,
              this.responseStatusSync
            );
          }
        }
      });
  }

  isNowAfterLastTimeSyncHour(lastTimeSyncComplete: string | null) {
    if (!lastTimeSyncComplete) return false;
    return (
      Date.now() - new Date(lastTimeSyncComplete).getTime() <=
      Utils.hoursToMilisecond(this.TIME_ABLE_TO_SYNC)
    );
  }

  setValueTypeSync({ className, iconName, title }: ValueTypeSync) {
    this.className = className;
    this.iconName = iconName;
    this.title = title;
  }

  onFocusSync() {
    this.isDropdownSync = !this.isDropdownSync;
    this.mapSubscriptionsList();
  }

  mapSubscriptionsList() {
    this.subscriptionsList = this.subscriptionsList.map((item) => {
      switch (this.typeSync) {
        case FlagTypeSync.SYNCING:
          if (
            item.lastStatusSync === StatusSync.INPROGRESS ||
            item.lastStatusSync === StatusSync.PENDING
          ) {
            return {
              ...item,
              className: 'syncing',
              iconName: IconsSync.SYNCING,
              lastStatusSync: StatusSync.INPROGRESS
            };
          } else {
            return {
              ...item,
              className: null,
              disabled: true,
              iconName: IconsSync.SYNC_DISABLED,
              lastStatusSync: null
            };
          }
        case FlagTypeSync.SYNC_SUCCESS:
        case FlagTypeSync.SYNC_ABLE:
          this.setValueTypeSync({
            title: 'sync',
            className: 'sync',
            iconName: IconsSync.SYNC_DOWNWARD
          });
          return {
            ...item,
            className: 'sync',
            disabled: false,
            iconName: IconsSync.SYNCING,
            lastStatusSync: null
          };
        case FlagTypeSync.SYNC_FAIL:
          if (item.lastStatusSync === StatusSync.FAIL) {
            return {
              ...item,
              className: 'sync-fail',
              iconName: IconsSync.SYNC_TRY_AGAIN,
              lastStatusSync: StatusSync.FAIL
            };
          } else {
            return {
              ...item,
              className: null,
              iconName: IconsSync.SYNCING,
              lastStatusSync: null
            };
          }
        default:
          return {
            ...item,
            className: null,
            iconName: IconsSync.SYNCING,
            lastStatusSync: null
          };
      }
    });
  }

  getLastSyncedCompleteAgencyId(): string | null {
    const lastSyncedAgency = this.originalSubscriptionsList.reduce(
      (prev, current) => {
        if (!prev || !prev.lastTimeSyncComplete) return current;
        if (!current || !current.lastTimeSyncComplete) return prev;
        return prev.lastTimeSyncComplete > current.lastTimeSyncComplete
          ? prev
          : current;
      },
      null as ISubscriptionsList
    );
    return lastSyncedAgency ? lastSyncedAgency.agencyId : null;
  }

  getLastSyncedCompleteSubscription(): ISubscriptionsList | null {
    const lastSyncedAgencyId = this.getLastSyncedCompleteAgencyId();
    if (!lastSyncedAgencyId) return null;
    const lastSyncedSubscription = this.originalSubscriptionsList.find(
      (subscription) => subscription.agencyId === lastSyncedAgencyId
    );
    return lastSyncedSubscription || null;
  }
  getLatestSyncedSubscription(subscriptions: ISubscriptionsList[]) {
    return subscriptions.reduce((prev, current) => {
      if (!prev) return current;
      if (!current) return prev;
      const prevSyncTime = prev.lastTimeSync
        ? new Date(prev.lastTimeSync).getTime()
        : 0;
      const currentSyncTime = current.lastTimeSync
        ? new Date(current.lastTimeSync).getTime()
        : 0;
      const prevPending =
        prev.lastStatusSync === StatusSync.PENDING ||
        prev.lastStatusSync === StatusSync.INPROGRESS;
      const currentPending =
        current.lastStatusSync === StatusSync.PENDING ||
        current.lastStatusSync === StatusSync.INPROGRESS;

      if (prevPending && !currentPending) return prev;
      if (!prevPending && currentPending) return current;

      return prevSyncTime > currentSyncTime ? prev : current;
    });
  }

  async overlayOutsideClick(event: MouseEvent) {
    const buttonElement = this.trigger.elementRef.nativeElement as HTMLElement;
    const targetElement = event.target as HTMLElement;
    if (!buttonElement.contains(targetElement)) {
      this.isDropdownSync = false;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }
  }
}
