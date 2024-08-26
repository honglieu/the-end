import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { IGlobalSearchConversation } from '@/app/dashboard/components/global-search/interfaces/global-search.interface';
import { Router } from '@angular/router';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { GlobalSearchService } from '@/app/dashboard/components/global-search/services/global-search.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { FilesService } from '@services/files.service';
import { EAvailableFileIcon } from '@shared/types/file.interface';
import {
  EConversationType,
  EHighLightTextType,
  EUserPropertyType,
  GroupType,
  TaskStatusType,
  TaskType
} from '@shared/enum';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { UppercaseFirstLetterPipe } from '@shared/pipes/uppercase-first-letter';
import { EConversationStatus } from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';

enum EDocumentType {
  contact = 'contact',
  attachment = 'attachment'
}

@Component({
  selector: 'search-result-row',
  templateUrl: './search-result-row.component.html',
  styleUrls: ['./search-result-row.component.scss'],
  providers: [UppercaseFirstLetterPipe]
})
export class SearchResultRowComponent implements OnInit, OnChanges, OnDestroy {
  @Input() searchResultRow: IGlobalSearchConversation;
  public destroy$ = new Subject<void>();
  public currentMailboxId: string;

  public documentType = EDocumentType;
  public taskType = TaskType;
  public contactAndAttachment = [];
  public remainingRecipients: number = 0;
  public EConversationType = EConversationType;
  public EConversationStatus = EConversationStatus;
  public EUserPropertyType = EUserPropertyType;
  public EHighLightTextType = EHighLightTextType;
  get searchTerm() {
    return this.globalSearchService.getGlobalSearchPayload().search.trim();
  }

  constructor(
    private router: Router,
    private inboxFilterService: InboxFilterService,
    private mailboxSettingService: MailboxSettingService,
    private globalSearchService: GlobalSearchService,
    private inboxService: InboxService,
    private filesService: FilesService
  ) {}

  ngOnInit(): void {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((mailboxId) => {
        this.currentMailboxId = mailboxId;
      });
  }

  mapToViewData(rowData: IGlobalSearchConversation) {
    const { from, to, lastMessage, conversationTitle, taskTitle, taskType } =
      rowData;
    const { firstName, lastName, email, originalEmailName } = from;
    const noPreview = 'No preview is available';
    const textContent = (lastMessage.textContent || '')
      .replace(/(<([^>]+)>)/gi, '')
      .trim();

    const message = (lastMessage.message || '')
      .replace(/(<([^>]+)>)/gi, '')
      .trim();

    const fromName =
      (firstName || lastName || email) &&
      ([firstName, lastName].join(' ').trim() || originalEmailName);

    rowData.from.phoneNumber =
      ([EConversationType.SMS, EConversationType.WHATSAPP].includes(
        rowData.conversationType
      ) &&
        rowData.conversationPhoneNumber) ||
      from?.phoneNumber ||
      from?.secondaryPhones?.[0]?.phoneNumber;

    const toFieldName = () => {
      switch (rowData.conversationType) {
        case EConversationType.EMAIL:
          if (!to.length) return '';
          const toField = to[0];
          if (toField.firstName || toField.lastName || toField.email) {
            return (
              [toField.firstName, toField.lastName].join(' ').trim() ||
              toField.originalEmailName
            );
          }
          return toField.phoneNumber;
        case EConversationType.APP:
          if (!to.length) return '';
          return [to[0].firstName, to[0].lastName].join(' ').trim();

        case EConversationType.VOICE_MAIL:
          return to.length ? 'Trudi' : '';
        case EConversationType.SMS:
          return 'Trudi';
        case EConversationType.WHATSAPP:
        case EConversationType.MESSENGER:
          return rowData.companyName;
        default:
          return '';
      }
    };

    this.remainingRecipients = to?.length - 1;

    const emailTitle = [
      EConversationType.EMAIL,
      EConversationType.APP,
      EConversationType.VOICE_MAIL
    ].includes(rowData.conversationType)
      ? conversationTitle || (taskType === TaskType.MESSAGE && taskTitle)
      : null;

    const contacts =
      rowData?.lastMessage?.options?.contacts?.map((contact) => ({
        ...contact,
        documentType: EDocumentType.contact
      })) || [];
    const medias =
      rowData?.propertyDocuments.map((file) => {
        return {
          ...file,
          documentType: EDocumentType.attachment,
          mediaType: this.filesService.getFileTypeSlash(file?.fileType),
          icon: this.getFileTrudiIcon(file?.name)
        };
      }) || [];
    this.contactAndAttachment = [...medias, ...contacts];
    const regexFindPTag = /^<p><\/p>$/;

    const getMessage = () => {
      if (
        message.includes('&nbsp;') ||
        regexFindPTag.test(lastMessage?.message)
      ) {
        if (medias?.length) {
          return medias[0].name;
        }
        if (contacts?.length) {
          return contacts[contacts.length - 1].title;
        }
        return message;
      }
      return message;
    };

    let msg = '';
    if (!!textContent) {
      msg = textContent === noPreview ? getMessage() : textContent;
    } else {
      msg = getMessage();
    }

    return {
      ...rowData,
      lastMessage: {
        ...lastMessage,
        message: msg
      },
      toField: { ...to?.[0] },
      emailTitle,
      fromName,
      toFieldName: toFieldName()
    };
  }

  ngOnChanges(simpleChanges: SimpleChanges) {
    if (simpleChanges['searchResultRow']?.currentValue) {
      this.searchResultRow = this.mapToViewData(this.searchResultRow);
    }
  }

  async handleNavigateToEmailResult() {
    this.globalSearchService.triggerCollapseDropdown$.next();
    const conversationBelongToMailboxId = this.searchResultRow.mailBoxId;

    if (
      conversationBelongToMailboxId &&
      this.searchResultRow.taskType === TaskType.MESSAGE &&
      conversationBelongToMailboxId !== this.currentMailboxId
    ) {
      const mailBoxList = await firstValueFrom(this.inboxService.listMailBoxs$);
      const filterMailbox = mailBoxList.find(
        (mailbox) => mailbox.id === conversationBelongToMailboxId
      );
      this.inboxService.setCurrentMailBox(filterMailbox);
      this.inboxService.setCurrentMailBoxId(conversationBelongToMailboxId);
      this.inboxService.setIsDisconnectedMailbox(false);
      this.inboxService.setIsArchiveMailbox(false);
      this.mailboxSettingService.setMailBoxId(conversationBelongToMailboxId);
      this.mailboxSettingService.setRole(filterMailbox.role);
      localStorage.removeItem('integrateType');
    }

    this.inboxFilterService.clearInboxFilter();

    if (this.searchResultRow.taskType === TaskType.MESSAGE) {
      const { taskStatus } = this.searchResultRow || {};
      const getRouterLinkByTaskStatus = (
        taskStatus: TaskStatusType,
        appType: 'APP' | 'SMS' | 'CON'
      ): ERouterLinkInbox => {
        const appMapping = {
          [TaskStatusType.inprogress]: ERouterLinkInbox.APP_MESSAGES_ALL,
          [TaskStatusType.completed]: ERouterLinkInbox.APP_MESSAGES_RESOLVED,
          [TaskStatusType.draft]: ERouterLinkInbox.APP_MESSAGES_DRAFT
        };

        const smsMapping = {
          [TaskStatusType.inprogress]: ERouterLinkInbox.SMS_MESSAGES_ALL,
          [TaskStatusType.completed]: ERouterLinkInbox.SMS_MESSAGES_RESOLVED
        };

        const conversationMapping = {
          [TaskStatusType.inprogress]: ERouterLinkInbox.MSG_INPROGRESS_ALL,
          [TaskStatusType.completed]: ERouterLinkInbox.MSG_COMPLETED,
          [TaskStatusType.draft]: ERouterLinkInbox.MSG_DRAFT,
          [TaskStatusType.deleted]: ERouterLinkInbox.MSG_DELETED
        };

        if (appType === 'APP') {
          return appMapping[taskStatus] || ERouterLinkInbox.APP_MESSAGES_ALL;
        } else if (appType === 'SMS') {
          return smsMapping[taskStatus] || ERouterLinkInbox.SMS_MESSAGES_ALL;
        } else if (appType === 'CON') {
          return (
            conversationMapping[taskStatus] ||
            ERouterLinkInbox.MSG_INPROGRESS_ALL
          );
        }

        return null;
      };
      const conversationFromEmail = getRouterLinkByTaskStatus(
        taskStatus,
        'CON'
      );
      const conversationFromApp = getRouterLinkByTaskStatus(taskStatus, 'APP');
      const conversationFromSMS = getRouterLinkByTaskStatus(taskStatus, 'SMS');
      const getRoute = () => {
        switch (this.searchResultRow.conversationType) {
          case EConversationType.APP:
            return conversationFromApp;
          case EConversationType.EMAIL:
            return conversationFromEmail;
          case EConversationType.VOICE_MAIL:
            return ERouterLinkInbox.VOICEMAIL_MESSAGES;
          case EConversationType.SMS:
            return conversationFromSMS;
          case EConversationType.WHATSAPP:
            return ERouterLinkInbox.WHATSAPP;
          case EConversationType.MESSENGER:
            return ERouterLinkInbox.MESSENGER;
          default:
            return [];
        }
      };

      const queryParams = {
        taskId: this.searchResultRow.taskId,
        conversationId: this.searchResultRow.conversationId,
        status: this.searchResultRow.taskStatus,
        search: '',
        timestamp: new Date().getTime(),
        mailBoxId: this.searchResultRow.mailBoxId
      };
      if (
        [EConversationType.MESSENGER, EConversationType.WHATSAPP].includes(
          this.searchResultRow.conversationType
        )
      ) {
        queryParams['channelId'] = this.searchResultRow.channelId;
      }
      this.router.navigate([`dashboard/inbox/${getRoute()}`], {
        queryParams
      });
      this.inboxService.justNavigateToMessageItem = true;
    }

    if (this.searchResultRow.taskType === TaskType.TASK) {
      const conversationTabByStatus = [
        EConversationStatus.open,
        EConversationStatus.draft,
        EConversationStatus.resolved,
        EConversationStatus.deleted
      ].find(
        (status) =>
          status ===
          (this.searchResultRow
            .conversationStatus as unknown as EConversationStatus)
      );
      const queryParams = {
        type: 'TASK',
        inboxType: GroupType.TEAM_TASK,
        conversationId: this.searchResultRow.conversationId,
        tab: conversationTabByStatus
      };
      const navigateToTaskDetailFn = (queryParams) => {
        this.router.navigate(
          ['dashboard', 'inbox', 'detail', this.searchResultRow.taskId],
          {
            queryParams,
            queryParamsHandling: 'merge'
          }
        );
      };
      const partOfNextPath = `inbox/detail/${this.searchResultRow.taskId}`;
      const isNavigateToCurrentTaskDetail =
        this.router.url.includes(partOfNextPath);
      if (isNavigateToCurrentTaskDetail) {
        this.router
          .navigateByUrl('/', { skipLocationChange: true })
          .then(() => {
            navigateToTaskDetailFn(queryParams);
          });
      } else {
        navigateToTaskDetailFn(queryParams);
      }
    }
  }

  getFileTrudiIcon(fileName: string) {
    switch (this.filesService.getFileIcon(fileName)) {
      case EAvailableFileIcon.Excel:
        return 'excel.svg';
      case EAvailableFileIcon.Calendar:
        return 'calendar-round.svg';
      case EAvailableFileIcon.PDF:
        return 'pdf';
      case EAvailableFileIcon.Doc:
        return 'doc';
      case EAvailableFileIcon.Image:
        return 'iconImage';
      case EAvailableFileIcon.Video:
        return 'videoV2';
      default:
        return 'question-mark';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
