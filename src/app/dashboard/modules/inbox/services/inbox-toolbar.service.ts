import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  Subject,
  auditTime,
  filter,
  mergeMap,
  of,
  takeUntil,
  tap
} from 'rxjs';
import { Toolbar } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { TaskItem } from '@shared/types/task.interface';
import { EInboxQueryParams, disabledSaveToRM } from '@shared/enum/inbox.enum';
import { EmailItem } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { EInboxAction } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { TaskStatusType } from '@shared/enum/task.enum';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { InboxService } from './inbox.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import {
  EInboxFilterSelected,
  EMessageQueryType
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { AutoScrollService } from './auto-scroll.service';

@Injectable({
  providedIn: 'root'
})
export class InboxToolbarService {
  public destroy$ = new Subject<void>();
  private inboxItem: BehaviorSubject<TaskItem[] | EmailItem[] | ITaskRow[]> =
    new BehaviorSubject<TaskItem[] | EmailItem[] | ITaskRow[]>([]);
  private activePath: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private listToolbarConfig: BehaviorSubject<Toolbar[]> = new BehaviorSubject<
    Toolbar[]
  >([]);
  private filterInboxList: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  private addMarginBottomInToInboxContent = new BehaviorSubject(false);
  private filterUnReadMessage: BehaviorSubject<string> =
    new BehaviorSubject<string>('');
  private updateMultipleTaskBS = new BehaviorSubject<IUpdateMultipleTask>(null);
  public triggerResetMessageDetail$ = new Subject<void>();
  public updateMultipleTask$ = this.updateMultipleTaskBS.asObservable();
  public isShowToolbar = new BehaviorSubject<boolean>(true);
  public hasItem = false;
  public countSelectedItems = 0;
  public isArchivedMailbox: boolean;
  public selectedItemsMap: Record<string, boolean>;

  constructor(
    private activeRouter: ActivatedRoute,
    private sharedMessageViewService: SharedMessageViewService,
    private autoScrollService: AutoScrollService,
    public inboxService: InboxService
  ) {
    this.inboxService.isArchiveMailbox$.subscribe((isArchivedMailbox) => {
      this.isArchivedMailbox = isArchivedMailbox;
    });
  }

  get filterUnReadMessage$(): Observable<string> {
    return this.filterUnReadMessage.asObservable();
  }

  setFilterUnReadMessage(value: string) {
    this.filterUnReadMessage.next(value);
  }

  get addMarginBottomInToInboxContent$() {
    return this.addMarginBottomInToInboxContent.asObservable();
  }

  public setInboxContentMarginStatus(status: boolean) {
    this.addMarginBottomInToInboxContent.next(status);
  }

  isSelectedItem(itemId: string) {
    return Boolean(this.selectedItemsMap?.[itemId]);
  }

  // getter setter for value
  get inboxItem$(): Observable<TaskItem[] | EmailItem[] | ITaskRow[]> {
    return this.inboxItem.asObservable();
  }

  setInboxItem(value: TaskItem[] | EmailItem[] | ITaskRow[]) {
    this.selectedItemsMap = (
      value as (TaskItem | EmailItem | ITaskRow)[]
    )?.reduce((acc: Record<string, boolean>, item) => {
      acc[item.id] = true;
      return acc;
    }, {});
    this.countSelectedItems = value?.length;
    this.hasItem = !!value?.length;
    this.inboxItem.next(value);
  }

  updateInboxItem(ids: string[], field, value) {
    const newInboxItem = this.inboxItem.getValue().map((item) =>
      ids.includes(item.id)
        ? {
            ...item,
            conversations: item.conversations.map((cov) => ({
              ...cov,
              [field]: value
            }))
          }
        : item
    );

    this.inboxItem.next(newInboxItem);
  }

  setValueActivePath(value: string) {
    this.activePath.next(value);
  }

  get listToolbarConfig$(): Observable<Toolbar[]> {
    return this.listToolbarConfig.asObservable();
  }

  setListToolbarConfig(value: Toolbar[]) {
    this.listToolbarConfig.next(value);
  }

  get filterInboxList$(): Observable<boolean> {
    return this.filterInboxList.asObservable();
  }

  setFilterInboxList(value: boolean) {
    this.filterInboxList.next(value);
  }

  getListToolbar(
    config: toolbarConfig,
    isDisabledSaveToRM?: disabledSaveToRM,
    isDisabledSaveToPT?: disabledSaveToRM
  ) {
    const isCheckedPath = this.activePath.value === EInboxQueryParams.TASKS;
    const isCheckedPathGmail =
      this.activePath.value === EInboxQueryParams.EMAIL;
    const queryParam = isCheckedPath
      ? EInboxQueryParams.TASK_STATUS
      : EInboxQueryParams.STATUS;

    const keyParam = isCheckedPath
      ? TaskStatusType.inprogress
      : this.activeRouter.snapshot.queryParams[queryParam];
    const objectKey = Object.keys(config).find(
      (item) => item?.toLocaleLowerCase() === keyParam?.toLocaleLowerCase()
    );

    let toolbarConfig: Toolbar[] = config[objectKey] || [];

    if (keyParam === TaskStatusType.deleted && isCheckedPath) {
      toolbarConfig = toolbarConfig.filter((res) => res.label !== 'Reopen');
    }

    if (isDisabledSaveToRM?.isRmEnvironment) {
      const removeExportConversationHistory = (item) =>
        item.key !== EInboxAction.EXPORT_CONVERSATION_HISTORY;

      toolbarConfig = toolbarConfig
        .filter(removeExportConversationHistory)
        .map((tool) => ({
          ...tool,
          children: tool.children?.filter(removeExportConversationHistory)
        }));
    }

    if (
      (keyParam === TaskStatusType.completed && isCheckedPath) ||
      !isDisabledSaveToRM?.isRmEnvironment
    ) {
      toolbarConfig = toolbarConfig.filter(
        (res) => res.label !== 'Save to Rent Manager'
      );
    }
    const checkState = (child) => {
      if (child.label === 'Save to Rent Manager') {
        child.disabled =
          isDisabledSaveToRM?.isArchivedMailbox ||
          isDisabledSaveToRM?.isCheckSyncingStatus;
      }
      if (child?.key === EInboxAction.SAVE_TO_PROPERTY_TREE) {
        child.disabled = isDisabledSaveToPT?.isCheckSyncingStatus;
      }
    };
    toolbarConfig.forEach((item) => {
      if (item?.children) {
        item.children.forEach((child) => {
          checkState(child);

          if (child?.grandchildren) {
            child?.grandchildren.forEach((child) => {
              checkState(child);
            });
          }
        });
      }
    });
    if (isCheckedPath) {
      toolbarConfig = toolbarConfig.filter(
        (item) =>
          !(
            [
              EInboxAction.FORWARD,
              EInboxAction.ADD_TO_TASK,
              EInboxAction.MOVE_TO_FOLDER,
              EInboxAction.MOVE_TO_TASK,
              EInboxAction.MOVE_MESSAGE,
              EInboxAction.RE_OPEN,
              EInboxAction.CREATE,
              EInboxAction.REPORT_SPAM,
              EInboxAction.EXPORT_CONVERSATION_HISTORY,
              isDisabledSaveToRM?.isRmEnvironment
                ? EInboxAction.EXPORT_TASK_ACTIVITY
                : ''
            ] as string[]
          ).includes(item.key)
      );

      toolbarConfig = this.replaceToolbarConfigLabels(
        toolbarConfig,
        {
          'Mark as resolved': 'Mark as completed',
          Delete: 'Permanently delete'
        },
        this.inboxItem.value,
        isCheckedPath,
        {
          'Mark as completed': 'task-float-popup-mark-as-completed-button',
          'Permanently delete': 'task-float-popup-permanently-delete-button'
        }
      );
    } else {
      toolbarConfig = toolbarConfig.filter(
        (item) =>
          // item.key !== EInboxAction.SEND_MESSAGE &&
          ![EInboxAction.MOVE_TASK, EInboxAction.EXPORT_TASK_ACTIVITY].includes(
            item.key as EInboxAction
          )
      );
      toolbarConfig = toolbarConfig.map((item) => ({
        ...item,
        children: item?.children?.filter(
          (item) =>
            ![
              EInboxAction.MOVE_TASK,
              EInboxAction.EXPORT_TASK_ACTIVITY
            ].includes(item.key as EInboxAction)
        )
      }));
      // toolbarConfig = toolbarConfig.filter(
      //   (item) => item.key !== EInboxAction.SEND_MESSAGE
      // ); // todo show in message index TDI-9225

      if (
        keyParam === TaskStatusType.completed ||
        keyParam === TaskStatusType.deleted
      ) {
        toolbarConfig = toolbarConfig.filter(
          (res) => res.key !== EInboxAction.MOVE_TASK
        );
      }

      toolbarConfig = this.replaceToolbarConfigLabels(
        toolbarConfig,
        {
          'Mark as completed': 'Mark as resolved',
          'Permanently delete': 'Delete'
        },
        this.inboxItem.value,
        isCheckedPath,
        {
          'Mark as resolved': 'tool-bar-mark-as-resolved',
          Delete: 'tool-bar-delete'
        }
      );
    }
    if (this.inboxItem.value?.length > 0) {
      toolbarConfig = [
        {
          count: this.inboxItem.value?.length || 0,
          label: 'Selected'
        },
        ...toolbarConfig
      ];
    }

    if (keyParam !== TaskStatusType.mailfolder) {
      toolbarConfig = toolbarConfig.filter((item) =>
        this.isArchivedMailbox ? item?.key !== EInboxAction.REPORT_SPAM : true
      );
    }

    this.listToolbarConfig.next(toolbarConfig);
  }

  private replaceToolbarConfigLabels(
    toolbarConfig: Toolbar[],
    variable: Record<string, string>,
    inboxItem?: TaskItem[] | EmailItem[] | ITaskRow[],
    isTask?: boolean,
    dataE2e?: Record<string, string>
  ): Toolbar[] {
    const config = [...toolbarConfig];
    config.forEach((item) => {
      const newLabel = variable[item.label];
      const newDataE2e = dataE2e[newLabel];
      if (newLabel) {
        item.label = newLabel;
      }
      if (newDataE2e) {
        item.dataE2e = newDataE2e;
      }
    });
    return config;
  }

  public updateTasks(body: {
    action: EUpdateMultipleTaskAction;
    payload: IUpdateMultipleTaskPayload;
  }) {
    this.updateMultipleTaskBS.next(body);
  }

  get handleInboxItemSelection$(): Observable<{
    id: string;
    conversationId?: string;
    threadId?: string;
    isReset: boolean;
  }> {
    return this.inboxItem$.pipe(
      takeUntil(this.destroy$),
      auditTime(300),
      filter(() => {
        const routerStateUrl = this.activeRouter.snapshot['_routerState'].url;
        return (
          this.sharedMessageViewService.isSelectModeValue ||
          routerStateUrl.includes('/dashboard/tasks') ||
          routerStateUrl.includes('/dashboard/inbox/mail')
        );
      }),
      mergeMap((selectedList) => {
        const routerStateUrl = this.activeRouter.snapshot['_routerState'].url;
        const isInboxMail = routerStateUrl.includes('dashboard/inbox/mail');
        if (this.hasItem && selectedList.length === 1) {
          const msg = selectedList[0] as TaskItem;
          return of({
            id: msg.id,
            threadId: msg.threadId,
            conversationId: msg.conversationId || msg.conversations?.[0]?.id,
            isReset: false
          });
        }

        const currentQueryParams = this.activeRouter.snapshot.queryParamMap;
        const hasExistingQueryParam = (
          isInboxMail
            ? [EMessageQueryType.THREAD_ID, EMessageQueryType.EMAIL_MESSAGE_ID]
            : [
                EInboxFilterSelected.TASK_ID,
                EInboxFilterSelected.CONVERSATION_ID
              ]
        ).some((param: string) => currentQueryParams.get(param));

        if (
          (!this.hasItem && !hasExistingQueryParam) ||
          (this.hasItem && hasExistingQueryParam)
        ) {
          return of({
            id: null,
            conversationId: null,
            threadId: null,
            isReset: false
          });
        }

        return of(null);
      }),
      filter((rs) => !!rs),
      tap(() => this.autoScrollService.disableAutoScroll())
    );
  }
}

export interface toolbarConfig {
  inprogress: Toolbar[];
  completed: Toolbar[];
  deleted: Toolbar[];
  spam: Toolbar[];
  mailfolder?: Toolbar[];
}

export enum EUpdateMultipleTaskAction {
  DELETE = 'DELETE',
  CHANGE_POSITION = 'CHANGE_POSITION'
}

export interface IUpdateMultipleTaskPayload {
  tasks: ITaskRow[];
  targetId?: string;
  isAutoReopen?: boolean;
  isCompletedGroup?: boolean;
}

export interface IUpdateMultipleTask {
  action: EUpdateMultipleTaskAction;
  payload: IUpdateMultipleTaskPayload;
}
