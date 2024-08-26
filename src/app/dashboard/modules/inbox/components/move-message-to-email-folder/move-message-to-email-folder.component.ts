import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ConversationService } from '@services/conversation.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { ToastrService } from 'ngx-toastr';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { ActivatedRoute, Params } from '@angular/router';
import { EMessageQueryType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import {
  CAN_NOT_MOVE,
  getTitleToastMovingProcessing
} from '@services/messages.constants';
import { TaskItem } from '@shared/types/task.interface';
import {
  EMailFolderMoveType,
  EmailItem
} from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { TaskStatusType } from '@shared/enum/task.enum';
import { FolderService } from '@/app/dashboard/modules/inbox/services/inbox-folder.service';
import { EmailViewService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-view.service';
import { SharedService } from '@services/shared.service';
import { PreviewConversation } from '@shared/types/conversation.interface';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EInboxAction } from '@/app/dashboard/modules/inbox/enum/inbox.enum';

@Component({
  selector: 'move-message-to-email-folder',
  templateUrl: './move-message-to-email-folder.component.html',
  styleUrls: ['./move-message-to-email-folder.component.scss']
})
export class MoveMessageToEmailFolderComponent implements OnInit, OnDestroy {
  @Input() visible: boolean;
  @Input() subTitleMoveToTask: string;
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  private unsubscribe = new Subject<void>();
  public folderEmails: any;
  public newLabelId: string;
  public currentMailboxId: string;
  public currentMailboxIdEmailFolder: string;
  public conversationIds: string[];
  public conversation: PreviewConversation;
  private currentQueryParams: Params;
  public listMessageRemoved: TaskItem[] | EmailItem[];
  public currentLabelId: string;
  public isMailFolder: boolean;
  public mailBoxActive: boolean;
  public moveFormGroup: FormGroup;
  public mailBehavior: { deleted: string | null; resolved: string | null };
  public isConsole: boolean;
  constructor(
    public inboxService: InboxService,
    private agencyService: AgencyService,
    private conversationService: ConversationService,
    private emailApiService: EmailApiService,
    private inboxToolbarService: InboxToolbarService,
    private toastService: ToastrService,
    private inboxSidebarService: InboxSidebarService,
    private activatedRoute: ActivatedRoute,
    private mailboxSettingService: MailboxSettingService,
    private formBuilder: FormBuilder,
    private emailViewService: EmailViewService,
    private sharedService: SharedService,
    public folderService: FolderService,
    private sharedMessageViewService: SharedMessageViewService,
    private toastCustomService: ToastCustomService
  ) {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.moveFormGroup = this.formBuilder.group({
      moveEmailFolder: new FormControl(null, [Validators.required])
    });
  }

  ngOnInit(): void {
    this.mailboxSettingService.mailboxSetting$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res?.mailBehavior) {
          this.mailBehavior = res?.mailBehavior;
        }
      });
    combineLatest([
      this.activatedRoute.queryParams,
      this.inboxService.currentMailBoxEmailFolder$,
      this.inboxService.currentMailBox$,
      this.inboxService.showFolders,
      this.folderService.emailFoldersLoaded
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([route, mailBoxEmailFolder, mailBox, showFolders]) => {
        const currentMailBox =
          route[EMessageQueryType.MESSAGE_STATUS] === TaskStatusType.mailfolder
            ? mailBoxEmailFolder
            : mailBox;
        const list = this.folderService.flattenTreeEmailFolder(
          this.folderService.getEmailFolderByMailBoxId(currentMailBox.id)?.tree,
          '',
          currentMailBox.id
        );
        if (!list) {
          this.inboxService.setRefreshEmailFolderMailBox(currentMailBox);
          return;
        }
        if (!list) return;
        this.currentQueryParams = route;
        this.isMailFolder =
          this.currentQueryParams[EMessageQueryType.MESSAGE_STATUS] ===
          TaskStatusType.mailfolder;
        const folderTarget = list.find(
          (item) =>
            item.externalId ===
            this.currentQueryParams[EMessageQueryType.EXTERNAL_ID]
        );
        this.currentLabelId = folderTarget?.internalId;
        const listFolderCanMove = list.filter((item) => item.moveAble);
        let filterValue = null;
        switch (this.currentQueryParams[EMessageQueryType.MESSAGE_STATUS]) {
          case TaskStatusType.mailfolder:
            filterValue = this.currentLabelId;
            break;
          case TaskStatusType.completed:
            filterValue = this.mailBehavior?.resolved;
            break;
          case TaskStatusType.deleted:
            filterValue = this.mailBehavior?.deleted;
            break;
        }
        if (filterValue !== null) {
          this.folderEmails = listFolderCanMove.filter(
            (item) => item?.internalId !== filterValue
          );
        } else {
          this.folderEmails = listFolderCanMove;
        }
        const listEmailFolders =
          this.emailApiService.listEmailFolder.getValue();
        if (listEmailFolders.length) {
          this.folderEmails = this.folderEmails.filter((item) =>
            listEmailFolders.includes(item.internalId)
          );
        }
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.currentMailboxId = res;
      });

    this.inboxService
      .getCurrentMailBoxIdEmailFolder()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.currentMailboxIdEmailFolder = res;
      });

    this.conversationService.selectedConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((conversation: PreviewConversation) => {
        if (!conversation) return;
        this.conversation = conversation;
      });
    this.subscribeInboxItem();
    this.subscribeEmailMoveToAction();
  }

  subscribeEmailMoveToAction() {
    this.emailViewService.emailMoveToAction$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((emailMoveToAction) => {
        const isMailFolder =
          this.currentQueryParams[EMessageQueryType.MESSAGE_STATUS] ===
          'MAILFOLDER';
        if (isMailFolder) {
          this.conversationIds = [emailMoveToAction?.threadId];
        }
      });
  }

  subscribeInboxItem() {
    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.listMessageRemoved = res as TaskItem[] | EmailItem[];
          this.processInboxItems(res);
        }
      });
  }

  private processInboxItems(inboxItems) {
    const newListMessageRemoved = [];
    this.conversationIds = inboxItems
      .map((message) => {
        if (!this.isMailFolder) {
          newListMessageRemoved.push(message);
          return message?.conversations?.[0]?.id;
        }
        return message?.threadId;
      })
      .filter(Boolean);
    if (newListMessageRemoved.length) {
      this.listMessageRemoved = newListMessageRemoved;
    }
  }

  moveMessagesToEmailFolder() {
    if (this.conversation?.id) {
      this.conversationIds = [this.conversation.id];
    }
    const currentMailBoxId =
      this.currentQueryParams[EMessageQueryType.MESSAGE_STATUS] ===
      TaskStatusType.mailfolder
        ? this.currentMailboxIdEmailFolder
        : this.currentMailboxId;
    const folderSelected = this.folderService
      .flattenTreeEmailFolder(
        this.folderService.getEmailFolderByMailBoxId(currentMailBoxId).tree,
        '',
        currentMailBoxId
      )
      .find((item) => item.internalId === this.newLabelId);
    const payload = {
      newLabelId: this.newLabelId,
      mailBoxId:
        this.currentQueryParams[EMessageQueryType.MESSAGE_STATUS] ===
        TaskStatusType.mailfolder
          ? this.currentMailboxIdEmailFolder
          : this.currentMailboxId,
      currentLabelId: this.currentLabelId,
      isValidateTask:
        folderSelected?.wellKnownName === EInboxAction.INBOX &&
        this.currentQueryParams[EMessageQueryType.MESSAGE_STATUS] ===
          TaskStatusType.mailfolder,
      ...(this.isMailFolder
        ? { threadIds: this.conversationIds }
        : {
            conversationIds: this.conversationIds,
            //handle case get conversation status and type move to move conversation to mail folder
            currentStatus: this.currentQueryParams[
              EMessageQueryType.MESSAGE_STATUS
            ]
              ? this.currentQueryParams[EMessageQueryType.MESSAGE_STATUS]
              : this.conversation.status,
            typeMove:
              !this.currentQueryParams[EMessageQueryType.MESSAGE_STATUS] &&
              EMailFolderMoveType.TASK_TO_FOLDER
          })
    };
    if (!this.conversationIds.length) {
      // step toolbar
      this.handleMoveError();
      return;
    }

    this.toastService.clear();
    this.toastService.show(
      getTitleToastMovingProcessing(
        this.conversationIds,
        payload.isValidateTask ? TaskStatusType.inprogress : ''
      ),
      '',
      { disableTimeOut: false },
      'toast-syncing-custom'
    );

    this.emailApiService
      .moveMailFolder(payload)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          if (!res?.data?.length) {
            this.inboxSidebarService.refreshStatisticsUnreadTask(
              this.currentMailboxId
            );
            this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
              this.currentQueryParams[EMessageQueryType.MESSAGE_STATUS] ===
                TaskStatusType.mailfolder
                ? this.currentMailboxIdEmailFolder
                : this.currentMailboxId
            );
            this.resetSelectedMessage();
          } else {
            this.toastService.clear();
            this.emailViewService.handleConfirmMoveMailToInbox.next({
              data: res?.data,
              payload
            });
          }
        },
        error: (error) => {
          this.resetSelectedMessage();
          this.toastService.clear();
          this.toastService.error(
            error?.error?.message ?? 'Move to folder failed. Please try again.'
          );
        }
      });
  }

  resetSelectedMessage() {
    this.visible = false;
    this.conversationService.selectedConversation.next(null);
    this.conversationService.reloadConversationList.next(true);
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.sharedMessageViewService.setIsSelectingMode(false);
  }

  onSubmit() {
    if (this.moveFormGroup.invalid) {
      this.moveFormGroup.markAllAsTouched();
      return;
    }
    this.moveMessagesToEmailFolder();
    this.handleClose();
  }

  handleMoveError() {
    this.toastService.clear();
    this.toastService.success(CAN_NOT_MOVE);
    this.handleClose();
    this.resetSelectedMessage();
  }

  handleClose() {
    this.conversationService.selectedConversation.next(null);
    this.emailApiService.setlistEmailFolder([]);
    this.onCancel.emit();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
