import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ConversationService } from '@services/conversation.service';
import {
  MESSAGES_MOVING_TO_TASK,
  MESSAGE_MOVING_TO_TASK
} from '@services/messages.constants';
import { PropertiesService } from '@services/properties.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { TaskItem } from '@shared/types/task.interface';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { EMessageQueryType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { stringFormat } from '@core';
import { AppRoute } from '@/app/app.route';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { CompanyService } from '@services/company.service';
import { EConversationType } from '@shared/enum';

@Component({
  selector: 'move-message-to-task',
  templateUrl: './move-message-to-task.component.html',
  styleUrls: ['./move-message-to-task.component.scss']
})
export class MoveMessageToTaskComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Input() taskFolderId = '';
  @Input() subTitleMoveToTask = '';
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() onOpenCreateTaskOption: EventEmitter<void> =
    new EventEmitter<void>();

  public isFromVoiceMail: boolean = false;
  public selectedTaskId: string;
  private unsubscribe = new Subject<void>();
  public isDisabledButton: boolean = false;
  public isMissingRequiredField: boolean = false;
  private currentAgencyId: string;
  public isArchiveMailbox: boolean = false;
  public isConsole: boolean;
  public isDisconnected: boolean = false;
  public currentMailBoxId: string;
  public conversationIds: string[];
  public isLoading: boolean = false;
  public propertyIds: string[];
  public isShowAddress: boolean = false;
  public isUnHappyPath: boolean = false;
  public isRmEnvironment: boolean = false;
  private queryParams = {};
  public taskIds: string[];
  public selectedMessagesCheckBox: TaskItem[];
  public isFromTrudiApp: boolean = false;

  constructor(
    public conversationService: ConversationService,
    public propertyService: PropertiesService,
    public taskService: TaskService,
    private agencyService: AgencyService,
    private toastService: ToastrService,
    public inboxService: InboxService,
    private sharedService: SharedService,
    private inboxToolbarService: InboxToolbarService,
    private statisticService: StatisticService,
    private activeRouter: ActivatedRoute,
    private router: Router,
    private titleCasePipe: TrudiTitleCasePipe,
    private sharedMessageViewService: SharedMessageViewService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });
    this.subscribeInboxItem();

    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow: boolean) => (this.isArchiveMailbox = isShow));

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.currentMailBoxId = res;
      });

    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isDisconnected) => {
        this.isDisconnected = isDisconnected;
      });

    this.taskService.selectedTaskToMove
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.selectedTaskId = res;
        }
      });

    this.activeRouter.queryParams.subscribe((rs) => {
      this.queryParams = rs;
    });
  }

  subscribeInboxItem() {
    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: TaskItem[]) => {
        if (res) {
          this.selectedMessagesCheckBox = res;
          this.processInboxItems(res);
        }
      });
  }

  private processInboxItems(inboxItems) {
    this.conversationIds = inboxItems.map(
      (message: TaskItem) => message?.conversations?.[0]?.id
    );
    this.taskIds = inboxItems.map(
      (message: TaskItem) => message?.conversations?.[0]?.taskId
    );

    this.isFromVoiceMail =
      inboxItems.length === 1 &&
      inboxItems[0]?.conversations[0]?.conversationType ===
        EConversationType.VOICE_MAIL;

    this.isFromTrudiApp =
      inboxItems.length === 1 &&
      inboxItems[0]?.conversations[0]?.conversationType ===
        EConversationType.APP;
    this.isUnHappyPath = inboxItems.some((message) => message?.isUnHappyPath);
    this.propertyIds = inboxItems
      ?.map((message: TaskItem) => message?.property?.id)
      ?.filter(Boolean);
  }

  onSubmit() {
    if (this.isArchiveMailbox || this.isConsole) return;
    if (this.selectedTaskId) {
      const body = {
        newTaskId: this.selectedTaskId,
        conversationIds: this.conversationIds
      };
      this.taskService
        .checkMoveConversations(body)
        .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
        .subscribe({
          next: (res) => {
            this.toastService.show(
              this.conversationIds.length > 1
                ? MESSAGES_MOVING_TO_TASK
                : MESSAGE_MOVING_TO_TASK,
              '',
              { disableTimeOut: false },
              'toast-syncing-custom'
            );
            this.visible = false;
            this.inboxToolbarService.setInboxItem([]);
            this.inboxToolbarService.setFilterInboxList(false);
            this.sharedMessageViewService.setIsSelectingMode(false);
            const conversations = res?.moveableMessages
              .concat(res?.immovableMessages)
              ?.map((item) => item?.id);
            this.moveMessagesToTask(conversations);
          },
          error: (error) => {
            this.toastService.clear();
            this.toastService.error(error);
          }
        });
    }
  }

  moveMessagesToTask(listMove) {
    const body = {
      newTaskId: this.selectedTaskId,
      conversationIds: listMove,
      mailboxId: this.currentMailBoxId
    };
    this.taskService
      .moveConversations(body)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          this.toastService.clear();
          if (listMove === 0) {
            this.isDisabledButton = true;
          } else {
            this.isDisabledButton = false;
            const messageForToast =
              listMove?.length === 1
                ? 'Message moved to task'
                : `${listMove?.length} messages moved to task`;
            this.toastService.success(messageForToast);
            this.inboxService.movedMessages$.next(res);
            this.taskService.updateTaskItems$.next({
              listTaskId: [
                this.taskService.currentTaskId$.getValue(),
                this.selectedTaskId
              ]
            });
            this.router.navigate(
              [stringFormat(AppRoute.TASK_DETAIL, this.selectedTaskId)],
              {
                queryParams: {
                  type: 'TASK',
                  tab: this.conversationService.currentConversation?.value
                    ?.status,
                  conversationId:
                    this.conversationService.currentConversation?.value?.id ||
                    res?.[0]?.conversation?.id
                },
                replaceUrl: true
              }
            );
            this.statisticService.updateStatisticTotalTask(
              this.queryParams[EMessageQueryType.MESSAGE_STATUS],
              -listMove?.length
            );
            this.inboxToolbarService.setInboxItem([]);
            this.inboxToolbarService.setFilterInboxList(false);
            this.sharedMessageViewService.setIsSelectingMode(false);
            this.onCancel.emit();
          }
        },
        error: (error) => {
          this.toastService.clear();
          this.toastService.error(
            this.titleCasePipe.transform(error?.error?.message)
          );
          this.taskService.selectedTaskToMove.next(null);
        }
      });
  }

  handleOpenCreateTaskOptionModal() {
    this.onOpenCreateTaskOption.emit();
  }

  handleClose() {
    this.onCancel.emit();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
