import { Component, HostListener, OnInit } from '@angular/core';
import dayjs from 'dayjs';
import { Subject, combineLatest, firstValueFrom } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  first,
  takeUntil
} from 'rxjs/operators';
import { AgencyService } from '@services/agency.service';
import { ApiService } from '@services/api.service';
import { TIME_FORMAT } from '@services/constants';
import { PropertiesService } from '@services/properties.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SocketType } from '@shared/enum/socket.enum';
import { syncs } from 'src/environments/environment';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import {
  DetailTooltip,
  FlagTypeSync,
  IconsSync,
  StatusSync,
  ISubscriptionsList,
  TitleTooltip,
  ValueTypeSync
} from '@/app/dashboard/shared/types/sidebar.interface';
import { CompanyService } from '@services/company.service';
import { PortfolioService } from '@/app/dashboard/services/portfolio.service';
import { IPortfoliosGroups } from '@/app/profile-setting/portfolios/interfaces/portfolios.interface';
import { SharedService } from '@services/shared.service';

@Component({
  selector: 'sidebar-item-sync',
  templateUrl: './sidebar-item-sync.component.html',
  styleUrls: ['./sidebar-item-sync.component.scss']
})
export class SidebarItemSyncComponent implements OnInit {
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
  private unsubscribe = new Subject<void>();
  public lastTimeSynced: string;
  public lastCompleteSubscription: ISubscriptionsList;
  public portfoliosGroups: IPortfoliosGroups[];
  public originalSubscriptionsList: ISubscriptionsList[];
  public isConsole: boolean;

  constructor(
    private apiService: ApiService,
    private websocketService: RxWebsocketService,
    private agencyService: AgencyService,
    private propertyService: PropertiesService,
    private agencyDashboardService: AgencyDashboardService,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService,
    private portfolioService: PortfolioService,
    public readonly sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.firstLoadingStatus = true;
    this.isConsole = this.sharedService.isConsoleUsers();
    this.websocketService.onSocketSync
      .pipe(debounceTime(300), takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (
          res &&
          (res.type === SocketType.sync || res.params?.type === SocketType.sync)
        ) {
          this.propertyService.getProperties(this.currentAgencyId, false);
          this.getSubscriptionsList();
        }
      });

    this.companyService
      .getCurrentCompany()
      .pipe(
        takeUntil(this.unsubscribe),
        filter(Boolean),
        distinctUntilChanged()
      )
      .subscribe((company) => {
        this.getSubscriptionsList();
        this.isRmEnvironment =
          this.agencyDashboardService.isRentManagerCRM(company);
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }
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
          this.formatSyncRes(this.responseStatusSync);
          this.firstLoadingStatus = false;
          this.originalSubscriptionsList.map(async (subscription) => {
            const lastSyncFormated = await this.formatDate(
              subscription.lastTimeSyncComplete
            );
            subscription.lastTimeSyncCompleteFormatted = lastSyncFormated;
          });
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
  }

  async willDoWithTypeSync(type: FlagTypeSync, res: ISubscriptionsList) {
    const lastCompleteSubscription = this.getLastSyncedCompleteSubscription();
    const formatLastTimeSynced = await this.formatDate(this.lastTimeSynced);
    const detail = await this.mapDetailHover(
      formatLastTimeSynced,
      lastCompleteSubscription?.subscriptionName
    );
    this.setToolTipDetail('hover', detail);
    this.setToolTipDetail('click', null);
    this.typeSync = type;
    this.mapWithTypeSync(type);
  }

  setToolTipDetail(
    event: keyof typeof this.titleTooltip,
    detail: DetailTooltip | null
  ) {
    this.titleTooltip[event] = detail;
  }

  mapWithTypeSync(type: FlagTypeSync) {
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
        this.setValueTypeSync({
          title: 'synced',
          className: 'synced',
          iconName: IconsSync.SYNC_SUCCESS
        });
        break;
    }
  }

  mapDetailNextSync() {
    const lastSyncedSubscription = this.getLastSyncedCompleteSubscription();
    if (!lastSyncedSubscription?.lastTimeSyncComplete) return null;
    const tz = this.agencyDateFormatService.getCurrentTimezone();
    const header = 'You have exceeded your number of syncs for this hour.';
    const date = dayjs(this.lastTimeSynced)
      .add(1, 'hour')
      .tz(tz.value)
      .format(TIME_FORMAT);
    const subscriptionName = '';
    const content = `You can next sync at ${date}.`;
    return { header, subscriptionName, content };
  }

  async mapDetailHover(lastTime, name) {
    const header = this.isRmEnvironment
      ? `Sync Rent Manager`
      : `Sync Property Tree`;
    if (!lastTime) return { header, content: '' };
    const subscriptionName = name;
    const content = `Last sync time: ${lastTime}`;
    return { header, subscriptionName, content };
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
    const isShowErrorNextSync =
      this.typeSync === FlagTypeSync.SYNC_SUCCESS &&
      this.isNowAfterLastTimeSyncHour(this.lastTimeSynced);
    if (dontSync) return;
    if (this.typeSync !== FlagTypeSync.SYNC_SUCCESS) {
      await this.willDoWithTypeSync(
        FlagTypeSync.SYNCING,
        this.responseStatusSync
      );
    }
    if (isShowErrorNextSync) {
      const { content, subscriptionName, header } = this.mapDetailNextSync();
      this.setToolTipDetail('click', { header, subscriptionName, content });
      return;
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

  @HostListener('mouseleave') mouseleave() {
    if (this.typeSync === FlagTypeSync.SYNC_SUCCESS) {
      this.setToolTipDetail('click', null);
      this.preTitleTooltip = this.titleTooltip.hover;
      this.setToolTipDetail('hover', null);
    }
    this.showSubscription = false;
  }
  @HostListener('mouseenter') mouseenter() {
    if (
      !this.titleTooltip.hover &&
      this.typeSync === FlagTypeSync.SYNC_SUCCESS
    ) {
      this.setToolTipDetail('hover', this.preTitleTooltip);
    }
  }

  hoursToMilisecond(hours: number) {
    return hours * 60 * 60 * 1000;
  }

  isNowAfterLastTimeSyncHour(lastTimeSyncComplete: string | null) {
    if (!lastTimeSyncComplete) return false;
    return (
      Date.now() - new Date(lastTimeSyncComplete).getTime() <=
      this.hoursToMilisecond(this.TIME_ABLE_TO_SYNC)
    );
  }

  setValueTypeSync({ className, iconName, title }: ValueTypeSync) {
    this.className = className;
    this.iconName = iconName;
    this.title = title;
  }
  async onSyncButtonClick() {
    switch (this.typeSync) {
      case FlagTypeSync.SYNCING:
        this.showSubscription = false;
        break;
      case FlagTypeSync.SYNC_SUCCESS:
        if (this.isNowAfterLastTimeSyncHour(this.lastTimeSynced)) {
          const {
            content,
            subscriptionName = '',
            header
          } = this.mapDetailNextSync();
          this.setToolTipDetail('click', { header, subscriptionName, content });
          this.showSubscription = false;
        } else if (this.subscriptionsList.length === 1) {
          this.onSync(this.subscriptionsList[0].agencyId);
          this.showSubscription = false;
        } else {
          this.showSubscription = true;
        }
        break;
      case FlagTypeSync.SYNC_ABLE:
      case FlagTypeSync.SYNC_FAIL:
        if (this.subscriptionsList.length === 1) {
          this.onSync(this.subscriptionsList[0].agencyId);
          this.showSubscription = false;
        } else {
          this.showSubscription = true;
        }
        break;
      default:
        this.showSubscription = true;
    }
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
      return prevSyncTime > currentSyncTime ? prev : current;
    });
  }
}
