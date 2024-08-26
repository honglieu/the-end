import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EMailBoxStatus, EMailBoxType } from '@shared/enum';
import { IMailBox } from '@shared/types/user.interface';
import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  takeUntil,
  tap
} from 'rxjs';
import { GlobalSearchService } from '@/app/dashboard/components/global-search/services/global-search.service';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { EUserMailboxRole } from '@/app/mailbox-setting/utils/enum';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { SharedService } from '@services/shared.service';
import { isEqual } from 'lodash';
import { TrudiSelectDropdownV2Component } from '@trudi-ui';

@Component({
  selector: 'filter-mailbox',
  templateUrl: './filter-mailbox.component.html',
  styleUrls: ['./filter-mailbox.component.scss']
})
export class FilterMailboxComponent implements OnInit, OnDestroy {
  @ViewChild('hasMailboxContent') hasMailboxContent: ElementRef;
  @ViewChild('dropdown') selectDropdown: TrudiSelectDropdownV2Component;
  @Input() isLoading: boolean = false;
  public listMailboxes: IMailBox[] = [];
  public selectedList = [];
  public isShowDropdown: boolean = false;
  public isExpandArchivedMailbox: boolean = false;
  public currentSelectedMailbox: IMailBox;
  textTooltip: string = `We've lost connection to your email account.`;
  readonly EMailBoxStatus = EMailBoxStatus;
  readonly EUserMailboxRole = EUserMailboxRole;
  readonly mailBoxType = EMailBoxType;
  public unreadList: { [x: string]: boolean } = {};
  public isConsole: boolean;
  private destroy$ = new Subject<void>();

  constructor(
    private inboxService: InboxService,
    private globalSearchService: GlobalSearchService,
    private mailboxSettingService: MailboxSettingService,
    private statisticService: StatisticService,
    private inboxFilterService: InboxFilterService,
    public readonly sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.statisticService
      .getStatisticUnreadInbox()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.unreadList = res;
        }
      });

    combineLatest([
      this.inboxService.listMailBoxs$,
      this.inboxService.listNotSharedMailBoxes$,
      this.mailboxSettingService.mailBoxId$
    ])
      .pipe(
        takeUntil(this.destroy$),
        filter(
          ([listMailboxes, listNotSharedMailboxes, currMailboxId]) =>
            Boolean(listMailboxes) &&
            Boolean(listNotSharedMailboxes) &&
            Boolean(currMailboxId)
        )
      )
      .subscribe(([listMailboxes, listNotSharedMailboxes, currMailboxId]) => {
        // TODO: check list when integrating new mailbox (expected show all except the integrating one)
        this.listMailboxes = [
          ...listMailboxes.filter(
            (item) =>
              ![EMailBoxStatus.INPROGRESS, EMailBoxStatus.SYNCING].includes(
                item.status
              )
          ),
          ...listNotSharedMailboxes.map((item) => ({
            ...item,
            isNotShared: true
          }))
        ].map((item) => ({
          ...item,
          label: item.name.trim() || item.emailAddress
        }));

        this.listMailboxes = this.listMailboxes.sort((a, b) => {
          if (
            a.type === this.mailBoxType.COMPANY &&
            a.status === EMailBoxStatus.ACTIVE
          )
            return -1;
          if (
            b.type === this.mailBoxType.COMPANY &&
            b.status === EMailBoxStatus.ACTIVE
          )
            return 1;

          if (
            a.status !== EMailBoxStatus.ARCHIVE &&
            b.status === EMailBoxStatus.ARCHIVE
          )
            return -1;
          if (
            a.status === EMailBoxStatus.ARCHIVE &&
            b.status !== EMailBoxStatus.ARCHIVE
          )
            return 1;
          return a?.name.localeCompare(b?.name);
        });
      });

    this.handleBindingWithPayload();
  }

  handleBindingWithPayload() {
    this.globalSearchService.globalSearchPayload$
      .pipe(
        takeUntil(this.destroy$),
        tap((payload) => {
          if (!payload?.search && this.selectDropdown) {
            this.selectDropdown.handleVisibleChange(false);
          }
        }),
        map((payload) => payload?.mailBoxIds || []),
        distinctUntilChanged(isEqual)
      )
      .subscribe((mailBoxIds) => {
        this.selectedList = mailBoxIds;
      });
  }

  handleSelectMailbox(selectedItems: string[] = []) {
    this.inboxFilterService.setGlobalSearchMailBox(
      selectedItems.length
        ? this.listMailboxes.filter((item) => selectedItems.includes(item.id))
        : []
    );
    this.globalSearchService.setGlobalSearchPayload({
      mailBoxIds: selectedItems || []
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
