import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { IMailBox } from '@shared/types/user.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  takeUntil,
  throttleTime
} from 'rxjs';
import { TaskItem } from '@shared/types/task.interface';
import { EmailItem } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { MessageApiService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-api.service';
import {
  EMailBoxStatus,
  EMailBoxType,
  SyncAttachmentType
} from '@shared/enum/inbox.enum';
import { ToastrService } from 'ngx-toastr';
import { ConversationService } from '@services/conversation.service';
import { TaskService } from '@services/task.service';
import { isEqual } from 'lodash-es';

@Component({
  selector: 'forward-inbox',
  templateUrl: './forward-inbox.component.html',
  styleUrls: ['./forward-inbox.component.scss']
})
export class ForwardInboxComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();
  @Input() showModal: boolean;
  @Output() onQuit: EventEmitter<void> = new EventEmitter();
  private taskIds: string[] = [];
  public radioListMailBox: IMailBox[] = [];
  public selectedValue: string;
  readonly mailBoxType = EMailBoxType;
  readonly EMailBoxStatus = EMailBoxStatus;
  readonly textTooltip = `We've lost connection to your email account.`;
  private currentMailBoxId: string;
  public isSyncedAttachment: boolean = false;
  public threadIds: string[] = [];
  public attachmentCount: number = 0;
  constructor(
    private inboxService: InboxService,
    private inboxToolbarService: InboxToolbarService,
    private messageApiService: MessageApiService,
    private toastrService: ToastrService,
    private conversationService: ConversationService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.inboxService.listMailBoxs$,
      this.inboxService.currentMailBox$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([listMailBox, currentMailBox]) => {
        if (listMailBox && currentMailBox) {
          this.currentMailBoxId = currentMailBox.id;
          this.radioListMailBox = listMailBox.filter(
            (mailBox) =>
              mailBox.id !== currentMailBox.id &&
              mailBox.status !== EMailBoxStatus.ARCHIVE &&
              mailBox.status !== EMailBoxStatus.DISCONNECT
          );
          this.sortMailboxByName(this.radioListMailBox);
          this.selectedValue =
            this.radioListMailBox.length > 0
              ? this.radioListMailBox[0].id
              : null;
        }
      });

    this.subscribeSyncAttachmentEvent();

    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs: TaskItem[] | EmailItem[]) => {
        if (!rs?.length) return;
        let totalAttachment = 0;
        let listThreadId = [];
        let syncedAttachment = true;
        this.taskIds = rs.map((item) => item.id);
        rs.forEach((task: TaskItem | EmailItem) => {
          if ('conversations' in task) {
            const {
              attachmentCount = 0,
              isSyncedAttachment,
              threadId
            } = task?.conversations?.[0] || {};
            totalAttachment += attachmentCount;
            if (threadId) listThreadId.push(threadId);
            if (!isSyncedAttachment) {
              syncedAttachment = false;
            }
          }
        });
        this.isSyncedAttachment = syncedAttachment;
        this.threadIds = [...new Set(listThreadId)];
        this.attachmentCount = totalAttachment;
      });
  }

  subscribeSyncAttachmentEvent() {
    this.taskService.triggerSyncAttachment
      .pipe(
        takeUntil(this.unsubscribe),
        throttleTime(300),
        distinctUntilChanged((prev, curr) => isEqual(prev, curr))
      )
      .subscribe((threadIds) => {
        if (
          threadIds?.length < 1 ||
          !threadIds.some((t) => this.threadIds.includes(t))
        )
          return;
        this.conversationService.syncAttachment({
          mailBoxId: this.currentMailBoxId,
          threadIds: this.threadIds,
          type: SyncAttachmentType.PORTAL_FOLDER
        });
      });
  }

  sortMailboxByName(listMailBox: IMailBox[]): void {
    listMailBox.sort((nameMailboxA, nameMailboxB) => {
      let nameMailboxLowerCaseA = nameMailboxA.name.toLowerCase();
      let nameMailboxLowerCaseB = nameMailboxB.name.toLowerCase();

      if (nameMailboxLowerCaseA < nameMailboxLowerCaseB) return -1;
      else if (nameMailboxLowerCaseA > nameMailboxLowerCaseB) return 1;
      return 0;
    });
  }

  handleConfirmForward(): void {
    this.messageApiService
      .forwardMessageToNewMailbox({
        taskIds: this.taskIds,
        mailBoxId: this.currentMailBoxId,
        newMailBoxId: this.selectedValue
      })
      .subscribe(() => {
        this.onQuit.emit();
        this.inboxToolbarService.setInboxItem([]);
        this.inboxToolbarService.setFilterInboxList(true);
        this.toastrService.success('Forwarded successfully');
        this.selectedValue =
          this.radioListMailBox.length > 0 ? this.radioListMailBox[0].id : null;
      });
  }

  handleClose(): void {
    this.onQuit.emit();
    this.selectedValue =
      this.radioListMailBox.length > 0 ? this.radioListMailBox[0].id : null;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
