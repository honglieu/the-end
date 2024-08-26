import {
  selectFetchingTaskPreview,
  selectTaskPreviewData
} from '@core/store/task-preview';
import { taskPreviewActions } from '@core/store/task-preview/actions/task-preview.actions';
import { TaskEditorApiService } from '@/app/dashboard/modules/task-editor/services/task-editor-api.service';
import { ECRMId, TaskStatusType } from '@shared/enum';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationCancel,
  NavigationEnd,
  NavigationStart,
  Params,
  Router
} from '@angular/router';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  Subject,
  Subscription,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  merge,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { CompanyService } from '@services/company.service';
import {
  CALENDAR_WIDGET_EXPIRED_DAYS,
  DEBOUNCE_SOCKET_TIME
} from '@services/constants';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedService } from '@services/shared.service';
import { SocketType } from '@shared/enum/socket.enum';
import { GroupType } from '@shared/enum/user.enum';
import { ITaskPreview } from '@shared/types/task.interface';
import { InternalNoteApiService } from '@/app/task-detail/modules/internal-note/services/internal-note-api.service';
import {
  ITaskPreviewPayload,
  ITaskRow
} from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { ConversationService } from '@services/conversation.service';
import { CurrentUser } from '@shared/types/user.interface';
import { UserService } from '@/app/dashboard/services/user.service';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ETypePage } from '@/app/user/utils/user.enum';
import {
  closeNotification,
  openNotification
} from '@/app/dashboard/animation/triggerNotificationAnimation';
import { transition, trigger, useAnimation } from '@angular/animations';

@Component({
  selector: 'task-preview',
  templateUrl: './task-preview.component.html',
  styleUrls: ['./task-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('openClose', [
      transition(':enter', [useAnimation(openNotification)]),

      transition(':leave', [useAnimation(closeNotification)])
    ])
  ]
})
export class TaskPreviewComponent implements OnInit, OnChanges, OnDestroy {
  public isLoading: boolean = false;
  public isShowPreview: boolean = false;
  public isShowPreviewAfterClickButton = false;
  public destroyRef: () => void;
  private destroy$ = new Subject<void>();
  public hasCheckedTask: boolean = false;
  public queryParams: Params;
  public ETaskQueryParams = ETaskQueryParams;
  public currentMailboxId: string;
  public hasTaskInFolder: boolean = false;
  public hasTaskInList: boolean = false;
  public taskPreviewPayload: ITaskPreviewPayload;
  public currentTaskId: string = '';
  public companyId: string = '';
  public currentCRMId: string;
  public calenderWidgetExpiredDays: {
    [type: string]: number;
  };
  public taskPreview: ITaskPreview;
  public displayPropertyProfile: boolean = false;
  public isShowPreviewBS: BehaviorSubject<boolean>;
  private currentUser: CurrentUser;
  public isNavigating: boolean = false;
  public routerEventsSubscription: Subscription;
  @Input() showAnimationSidePanel: boolean = false;
  @Input() isLoadingSkeleton: boolean = false;
  @Input() listTaskRow: ITaskRow[];
  @Output() changeTitleTask = new EventEmitter();

  constructor(
    private activeRouter: ActivatedRoute,
    private inboxToolbarService: InboxToolbarService,
    private websocketService: RxWebsocketService,
    private inboxService: InboxService,
    private internalNoteApiService: InternalNoteApiService,
    private readonly store: Store,
    private sharedService: SharedService,
    private companyService: CompanyService,
    private taskEditorApiService: TaskEditorApiService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private conversationService: ConversationService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listTaskRow']?.currentValue) {
      this.hasTaskInFolder = !!this.listTaskRow.length;
      this.checkHasTaskInList();

      const newValue = !!this.listTaskRow.length;
      if (this.hasTaskInFolder !== newValue) {
        this.hasTaskInFolder = newValue;
        this.changeDetectorRef.markForCheck();
      }
    }
  }

  ngOnInit(): void {
    this.onStoreChange();
    this.routerEventsSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isNavigating = true;
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel
      ) {
        this.isNavigating = false;
      }
    });
    this.activeRouter.queryParams
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => {
          const isTaskIdChange =
            res?.[ETaskQueryParams.TASK_ID] &&
            this.queryParams?.[ETaskQueryParams.TASK_ID] !==
              res?.[ETaskQueryParams.TASK_ID];
          this.queryParams = res;
          this.currentTaskId = res?.[ETaskQueryParams.TASK_ID];
          this.changeDetectorRef.markForCheck();
          return isTaskIdChange;
        }),
        tap((queryParam) => {
          const folderId = queryParam[ETaskQueryParams.TASKTYPEID];
          const isConsole = this.sharedService.isConsoleUsers();
          this.taskPreviewPayload = {
            taskId: queryParam[ETaskQueryParams.TASK_ID],
            isFocusedView: isConsole
              ? false
              : queryParam[ETaskQueryParams.INBOXTYPE] === GroupType.MY_TASK,
            ...(folderId ? { folderId } : {})
          };
          this.store.dispatch(
            taskPreviewActions.payloadChange({
              payload: this.taskPreviewPayload
            })
          );
        })
      )
      .subscribe();

    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((inboxItem) => {
        this.hasCheckedTask = !!inboxItem.length;
        this.changeDetectorRef.markForCheck();
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentMailboxId) => {
        if (!currentMailboxId) return;
        this.currentMailboxId = currentMailboxId;
      });

    this.userService
      .getSelectedUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => (this.currentUser = rs));

    this.handleRefreshData();
    this.subscribeTaskSocket();
    this.getCalenderWidgetExpiredDays();
    this.handleShowPreview();
  }

  handleShowPreview = () => {
    this.isShowPreviewBS.pipe(takeUntil(this.destroy$)).subscribe((isShow) => {
      this.isShowPreview = isShow;
      this.changeDetectorRef.detectChanges();
    });
  };

  getCalenderWidgetExpiredDays() {
    this.companyService
      .getCurrentCompany()
      .pipe(
        filter((company) => Boolean(company?.CRM)),
        switchMap((company) => {
          this.currentCRMId = company?.CRM;
          this.companyId = company?.id;
          return this.taskEditorApiService.getCalendarEvent(company?.CRM);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((events) => {
        switch (this.currentCRMId) {
          case ECRMId.PROPERTY_TREE:
            this.calenderWidgetExpiredDays = CALENDAR_WIDGET_EXPIRED_DAYS;
            break;
          case ECRMId.RENT_MANAGER:
            const inspectionEvents = events?.reduce((obj, event) => {
              if (event?.label?.includes('inspection')) {
                return {
                  ...obj,
                  [event.value]: 3
                };
              }
              return obj;
            }, Object.create(null));
            this.calenderWidgetExpiredDays = {
              ...CALENDAR_WIDGET_EXPIRED_DAYS,
              ...inspectionEvents
            };
            break;
        }
      });
  }

  onStoreChange() {
    const taskPreviewRes$ = this.store
      .select(selectTaskPreviewData)
      .pipe(filter(Boolean));
    const fetching$ = this.store.select(selectFetchingTaskPreview);

    combineLatest([taskPreviewRes$, fetching$])
      .pipe(takeUntil(this.destroy$), debounceTime(100))
      .subscribe(([taskPreview, fetching]) => {
        this.isLoading = fetching;
        this.displayPropertyProfile = false;

        if (
          !this.isLoading &&
          this.taskPreviewPayload?.taskId === taskPreview?.id
        ) {
          this.taskPreview = taskPreview;
          this.checkHasTaskInList();
        }
        this.changeDetectorRef.markForCheck();
      });
  }

  checkHasTaskInList() {
    if (this.taskPreview) {
      this.hasTaskInList = this.listTaskRow.some(
        (item) => item.id === this.taskPreview.id
      );
    }
  }

  private handleSocketNewUnreadNote() {
    this.websocketService.onSocketNewUnreadNoteData
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => res?.taskId === this.currentTaskId)
      )
      .subscribe((data) => {
        const internalNotes = this.taskPreview.internalNotes;
        if (data?.unreadCount !== internalNotes.unReadData.unreadCount) {
          internalNotes.unReadData.unreadCount = data?.unreadCount;
          this.updateTaskPreview({ internalNotes });
        }

        this.changeDetectorRef.markForCheck();
      });
  }

  handleRefreshData() {
    merge(this.subscribeConversationSocket(), this.subscribeMessageSocket())
      .pipe(
        takeUntil(this.destroy$),
        filter(() => Boolean(this.taskPreviewPayload)),
        debounceTime(DEBOUNCE_SOCKET_TIME),
        tap((res) => {
          this.store.dispatch(
            taskPreviewActions.payloadChange({
              payload: this.taskPreviewPayload
            })
          );
        })
      )
      .subscribe();
  }

  // handle realtime resolve, re-opened, send message conversation
  subscribeMessageSocket() {
    return merge(
      this.websocketService.onSocketMessage.pipe(
        takeUntil(this.destroy$),
        filter((res) => {
          return (
            res &&
            this.taskPreview &&
            res.companyId === this.companyId &&
            res.mailBoxId === this.currentMailboxId &&
            res?.[ETaskQueryParams.TASK_ID] ===
              this.queryParams?.[ETaskQueryParams.TASK_ID]
          );
        })
      ),
      this.websocketService.onSocketSend.pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        filter((res) => {
          return (
            res &&
            this.taskPreview &&
            res.companyId === this.companyId &&
            res?.['mailBoxId'] === this.currentMailboxId &&
            res.taskId === this.queryParams?.[ETaskQueryParams.TASK_ID]
          );
        })
      ),
      this.websocketService.onSocketJob.pipe(
        takeUntil(this.destroy$),
        filter(
          (response) =>
            Boolean(response) && response?.taskId === this.currentTaskId
        )
      )
    );
  }

  // handle realtime when delete, complete, change title task row
  subscribeTaskSocket() {
    this.websocketService.onSocketTask
      .pipe(
        takeUntil(this.destroy$),
        filter((data) => {
          return (
            data &&
            data.type &&
            this.taskPreview &&
            (data.taskId || data.id) ===
              this.queryParams?.[ETaskQueryParams.TASK_ID]
          );
        }),
        distinctUntilChanged(),
        debounceTime(DEBOUNCE_SOCKET_TIME)
      )
      .subscribe((data) => {
        switch (data.type) {
          case SocketType.updateTask:
            this.handleUpdateTaskRealtime(data);
            break;
          case SocketType.changeStatusTask:
            this.handleChangeStatusTaskRealtime(data);
            break;
          default:
            break;
        }
      });
  }

  handleUpdateTaskRealtime(data) {
    this.updateTaskPreview({ title: data.title || data.indexTitle });
    this.changeDetectorRef.markForCheck();
  }

  handleChangeStatusTaskRealtime(data) {
    if (data.newStatus === TaskStatusType.completed) {
      this.store.dispatch(
        taskPreviewActions.payloadChange({
          payload: this.taskPreviewPayload
        })
      );
    }
    this.changeDetectorRef.markForCheck();
  }

  subscribeConversationSocket() {
    return merge(
      // Note: handle read/ unread of message
      this.websocketService.onSocketSeenConversation.pipe(
        takeUntil(this.destroy$),
        filter(
          ({ mailBoxId, fromUserId }) =>
            mailBoxId === this.currentMailboxId &&
            this.websocketService.checkIgnoreCurrentUser(fromUserId)
        )
      ),
      // handle socket move a conversations
      this.websocketService.onSocketConv.pipe(
        takeUntil(this.destroy$),
        filter(({ newTaskId }) => newTaskId === this.taskPreview?.id)
      ),
      // handle socket move multi conversation
      this.websocketService.onSocketMoveConversations.pipe(
        takeUntil(this.destroy$),
        filter(({ newTaskId }) => newTaskId === this.taskPreview?.id)
      ),
      this.websocketService.onSocketUnreadConversationInTask.pipe(
        takeUntil(this.destroy$),
        filter((data) => data.unReadCount?.taskId === this.taskPreview?.id)
      ),
      this.websocketService.onSocketMoveMessageToFolder.pipe(
        takeUntil(this.destroy$),
        tap((res) => {
          if (
            res?.fromUserId === this.currentUser?.id &&
            res?.mailBoxId === this.currentMailboxId
          ) {
            this.conversationService.handleMessageActionTriggered();
          }
        }),
        filter(
          (res) =>
            res?.listSuccess?.length &&
            res.listSuccess[0].taskId === this.taskPreview.id
        )
      ),
      this.websocketService.onSocketMoveEmailStatus.pipe(
        takeUntil(this.destroy$),
        filter((res) => {
          const _conversation = this.taskPreview?.conversations?.find(
            (item) => res.conversationInTaskId === item.id
          );
          return res?.listSuccess?.length && !!_conversation;
        })
      )
    );
  }

  handleChangeTitleTask(value) {
    this.changeTitleTask.emit(value);
  }

  updateTaskPreview(taskPreview: ITaskPreview) {
    this.store.dispatch(taskPreviewActions.setTaskPreview({ taskPreview }));
  }

  handleOpenPropertyProfile(): void {
    if (!this.taskPreview?.property || !this.taskPreview?.property?.id) return;

    this.displayPropertyProfile = true;
  }

  handleClosePropertyProfile(): void {
    this.isShowPreviewAfterClickButton = true;
    this.displayPropertyProfile = false;
    this.isShowPreviewBS.next(true);
  }

  handleClickOutside = (forceToClose: boolean = false) => {
    if (forceToClose && !this.displayPropertyProfile) {
      this.isShowPreviewBS.next(false);
      return;
    }
    const checkToShow =
      this.displayPropertyProfile || this.isShowPreviewAfterClickButton;
    this.isShowPreviewBS.next(checkToShow);
    this.isShowPreviewAfterClickButton = !checkToShow;
  };

  handleAnimationEnd(): void {
    if (!this.isShowPreview) {
      this.destroyRef();
      this.navigateIfNotBusy();
      this.destroyRouterEventsSubscription();
    }
  }

  navigateIfNotBusy() {
    if (!this.isNavigating) {
      this.router.navigate([], {
        queryParams: {
          taskId: null
        },
        queryParamsHandling: 'merge'
      });
    }
  }

  destroyRouterEventsSubscription() {
    if (this.routerEventsSubscription) {
      this.routerEventsSubscription.unsubscribe();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.updateTaskPreview(null);
  }

  protected readonly ETypePage = ETypePage;
}
