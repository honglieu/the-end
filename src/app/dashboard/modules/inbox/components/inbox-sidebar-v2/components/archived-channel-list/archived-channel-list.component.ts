import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { EMailBoxStatus, IMailBox, TaskStatusType } from '@/app/shared';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input
} from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { RxStrategyNames } from '@rx-angular/cdk/render-strategies';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map
} from 'rxjs';
import {
  EFolderType,
  IStatisticsEmail
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar-v2/components/sidebar-item-v2/sidebar-item-v2.component';
import {
  FACEBOOK_INBOX_ROUTE_DATA,
  WHATSAPP_INBOX_ROUTE_DATA
} from '@/app/dashboard/utils/inbox-sidebar-router-data';
import { SharedService } from '@/app/services/shared.service';
import { SharedMessageViewService } from '@/app/services/shared-message-view.service';
import { TaskService } from '@/app/services/task.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { StatisticUnread } from '@/app/dashboard/shared/types/statistic.interface';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';

@Component({
  selector: 'archived-channel-list',
  templateUrl: './archived-channel-list.component.html',
  styleUrls: ['./archived-channel-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArchivedChannelListComponent implements AfterViewInit {
  @Input() set listArchiveChannel(value: IMailBox[]) {
    this.archiveChannelList$.next(value);
  }

  @Input() set listMailBoxs(value: IMailBox[]) {
    this.mailBoxList$.next(value);
  }

  private readonly archiveChannelList$ = new BehaviorSubject<IMailBox[]>([]);
  private readonly mailBoxList$ = new BehaviorSubject<IMailBox[]>([]);

  public readonly archiveChannelContext$ = combineLatest([
    this.activatedRoute.queryParams.pipe(distinctUntilChanged()),
    this.mailBoxList$,
    this.archiveChannelList$,
    this.statisticService.getStatisticUnreadTaskChannel()
  ]).pipe(
    map(([queryParams, mailBoxList, archiveChannelList, unreadTaskStats]) => ({
      archiveChannels: this.getUnreadTaskDetails({
        queryParams,
        mailBoxList,
        archiveChannelList,
        unreadTaskStats
      })
    }))
  );

  public renderStrategy: RxStrategyNames = 'immediate';
  public isConsole: boolean;
  public EFolderType = EFolderType;
  constructor(
    private readonly statisticService: StatisticService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly sharedService: SharedService,
    private readonly sharedMessageViewService: SharedMessageViewService,
    private readonly taskService: TaskService,
    private readonly inboxService: InboxService,
    private readonly mailboxSettingService: MailboxSettingService,
    private readonly inboxToolbarService: InboxToolbarService,
    private readonly inboxSidebarService: InboxSidebarService
  ) {
    this.isConsole = this.sharedService.isConsoleUsers();
  }

  ngAfterViewInit(): void {
    this.renderStrategy = 'low';
  }

  private getUnreadTaskDetails(context: {
    queryParams: Params;
    mailBoxList: IMailBox[];
    archiveChannelList: IMailBox[];
    unreadTaskStats: StatisticUnread;
  }) {
    return context.archiveChannelList.map((item) => ({
      ...item,
      mailboxData: context.mailBoxList?.find((x) => x.id === item.mailBoxId),
      channelInboxRoutedata: this.getBadgeData({
        item,
        queryParams: context.queryParams,
        unreadTaskStats: context?.unreadTaskStats || []
      })
    }));
  }

  private getBadgeData({ item, queryParams, unreadTaskStats }) {
    const channelId = item.id;
    const isShowMessageInTask = queryParams['showMessageInTask'] === 'true';
    const totalField = isShowMessageInTask
      ? 'totalMessageInTaskCount'
      : 'totalMessageCount';
    const messageField = isShowMessageInTask ? 'messageInTask' : 'message';

    const taskType = this.isConsole
      ? TaskStatusType.team_task
      : queryParams[ETaskQueryParams.INBOXTYPE];
    const inboxType =
      taskType === TaskStatusType.team_task ? 'teamInbox' : 'myInbox';

    if (item?.type === EFolderType.WHATSAPP) {
      const totalWhatsapp =
        unreadTaskStats[channelId]?.[inboxType]?.[totalField]?.whatsapp;
      const unReadWhatsappCount =
        unreadTaskStats[channelId]?.[inboxType]?.[messageField]?.whatsapp;
      const statisticsWhatsappMessage: IStatisticsEmail[] = [
        {
          status: TaskStatusType.inprogress,
          unread: unReadWhatsappCount?.opened || 0,
          count: totalWhatsapp?.opened || 0
        },
        {
          status: TaskStatusType.resolved,
          unread: unReadWhatsappCount?.resolved || 0,
          count: totalWhatsapp?.resolved || 0
        }
      ];
      if (queryParams?.['channelId'] === channelId) {
        this.inboxSidebarService.setStatisticsWhatsappMessage(
          statisticsWhatsappMessage
        );
      }

      return {
        ...WHATSAPP_INBOX_ROUTE_DATA,
        name: item?.externalId,
        channelId,
        total: totalWhatsapp?.opened || 0,
        unReadMsgCount: unReadWhatsappCount?.opened || 0,
        statisticsWhatsappMessage
      };
    }

    const total =
      unreadTaskStats[channelId]?.[inboxType]?.[totalField]?.messenger
        ?.opened || 0;
    const unReadMsgCount =
      unreadTaskStats[channelId]?.[inboxType]?.[messageField]?.messenger
        ?.opened || 0;

    const statisticsfacebookMessage: IStatisticsEmail[] = [
      {
        status: TaskStatusType.inprogress,
        unread:
          unreadTaskStats[channelId]?.[inboxType]?.[messageField]?.messenger
            ?.opened || 0,
        count:
          unreadTaskStats[channelId]?.[inboxType]?.[totalField]?.messenger
            ?.opened || 0
      },
      {
        status: TaskStatusType.resolved,
        unread:
          unreadTaskStats[channelId]?.[inboxType]?.[messageField]?.messenger
            ?.resolved || 0,
        count:
          unreadTaskStats[channelId]?.[inboxType]?.[totalField]?.messenger
            ?.resolved || 0
      }
    ];

    if (queryParams?.['channelId'] === channelId) {
      this.inboxSidebarService.setStatisticsFacebookMessage(
        statisticsfacebookMessage
      );
    }

    return {
      ...FACEBOOK_INBOX_ROUTE_DATA,
      name: item.name,
      channelId,
      total,
      unReadMsgCount,
      statisticsfacebookMessage
    };
  }

  handleSelectChannelArchiveMenu(
    item: IMailBox,
    statistic: IStatisticsEmail[],
    folderType: EFolderType
  ): void {
    if (this.sharedMessageViewService.isShowSelectValue) {
      this.sharedMessageViewService.setIsShowSelect(false);
    }
    if (item) {
      this.inboxService.setCurrentMailBoxId(item.id);
      this.inboxService.setCurrentMailBox(item);
      this.inboxService.setIsDisconnectedMailbox(
        item.status === EMailBoxStatus.DISCONNECT
      );
      this.inboxService.setIsArchiveMailbox(
        item.status === EMailBoxStatus.ARCHIVE
      );
      this.mailboxSettingService.setMailBoxId(item.id);
      this.mailboxSettingService.setRole(item.role);
    }
    switch (folderType) {
      case EFolderType.MESSENGER:
        this.inboxSidebarService.setStatisticsFacebookMessage(statistic);
        break;
      case EFolderType.WHATSAPP:
        this.inboxSidebarService.setStatisticsWhatsappMessage(statistic);
        break;
      default:
        break;
    }
    this.clearToolbarActions();
  }

  private clearToolbarActions(): void {
    this.taskService.setSelectedConversationList([]);
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.sharedMessageViewService.setIsSelectingMode(false);
    this.inboxService.currentSelectedTaskTemplate$.next(null);
  }
}
