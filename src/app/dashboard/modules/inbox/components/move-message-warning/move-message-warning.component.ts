import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import {
  MESSAGES_MOVING_TO_TASK,
  MESSAGE_MOVING_TO_TASK
} from '@services/messages.constants';
import { TaskService } from '@services/task.service';
import { ConversationService } from '@services/conversation.service';
import { EPopupMoveMessToTaskState } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { MoveConversation } from '@shared/types/conversation.interface';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ActivatedRoute, Router } from '@angular/router';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { EMessageQueryType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { stringFormat } from '@core';
import { AppRoute } from '@/app/app.route';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';
import { SharedMessageViewService } from '@services/shared-message-view.service';

@Component({
  selector: 'move-message-warning',
  templateUrl: './move-message-warning.component.html',
  styleUrls: ['./move-message-warning.component.scss']
})
export class MoveMessageWarningComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Input() subTitleMoveToTask = '';
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();

  public warningMessageNotMoved =
    'The following messages cannot be moved to this task as they assigned to another property.';
  private unsubscribe = new Subject<void>();
  public moveableMessages: string[];
  public selectedTaskId: string;
  public isDisabledButton: boolean = false;
  public immovableMessages: MoveConversation[];
  public currentMailBoxId: string;
  private queryParams = {};

  constructor(
    public inboxService: InboxService,
    public inboxToolbarService: InboxToolbarService,
    private toastService: ToastrService,
    public taskService: TaskService,
    public conversationService: ConversationService,
    private agencyService: AgencyService,
    private activeRouter: ActivatedRoute,
    private statisticService: StatisticService,
    private router: Router,
    private titleCasePipe: TrudiTitleCasePipe,
    private sharedMessageViewService: SharedMessageViewService
  ) {}

  ngOnInit(): void {
    this.taskService.selectedTaskToMove
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.selectedTaskId = res;
      });

    this.inboxService.moveMessages$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        const moveableMessages = res?.moveableMessages?.map((item) => item?.id);
        this.moveableMessages = moveableMessages;
        this.immovableMessages = res?.immovableMessages;
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.currentMailBoxId = res;
      });

    this.activeRouter.queryParams.subscribe((rs) => {
      this.queryParams = rs;
    });
  }

  handleBack() {
    this.inboxService.setPopupMoveToTaskState(
      EPopupMoveMessToTaskState.MOVE_MESSAGE_TO_TASK
    );
  }

  handleNext() {
    this.toastService.show(
      this.moveableMessages.length > 1
        ? MESSAGES_MOVING_TO_TASK
        : MESSAGE_MOVING_TO_TASK,
      '',
      { disableTimeOut: false },
      'toast-syncing-custom'
    );
    this.isDisabledButton = true;
    const body = {
      newTaskId: this.selectedTaskId,
      conversationIds: this.moveableMessages,
      mailboxId: this.currentMailBoxId,
      agencyId: this.taskService.currentTask$.value?.agencyId
    };
    this.visible = false;
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.sharedMessageViewService.setIsSelectingMode(false);
    this.taskService
      .moveConversations(body)
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          this.toastService.clear();
          if (this.moveableMessages?.length === 0) {
            this.isDisabledButton = true;
          } else {
            this.isDisabledButton = false;
            const messageForToast =
              this.moveableMessages?.length === 1
                ? 'Message moved to task'
                : `${this.moveableMessages?.length} messages moved to task`;
            this.toastService.success(messageForToast);
            this.statisticService.updateStatisticTotalTask(
              this.queryParams[EMessageQueryType.MESSAGE_STATUS],
              -this.moveableMessages?.length
            );
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
                queryParams: { type: 'TASK' },
                replaceUrl: true
              }
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

  handleClose() {
    this.onCancel.emit();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
