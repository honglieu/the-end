import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  BehaviorSubject,
  Subject,
  firstValueFrom,
  take,
  takeUntil,
  distinctUntilChanged,
  filter,
  switchMap
} from 'rxjs';
import { TaskService } from '@services/task.service';
import { IAssignedAgentValue } from '@shared/components/assign-to-agents/assign-to-agents/assign-to-agents.component';
import { TaskStatusType } from '@shared/enum/task.enum';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { SharedService } from '@services/shared.service';
import { GroupType } from '@shared/enum/user.enum';
import { PropertiesService } from '@services/properties.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { FormControl, Validators } from '@angular/forms';
import { TrudiTextFieldComponent } from '@trudi-ui';
import { TaskGroupService } from '@/app/dashboard/modules/task-page/services/task-group.service';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { ETaskMenuOption } from '@/app/dashboard/modules/task-page/enum/task.enum';
import { TIME_NOW } from '@/app/dashboard/utils/constants';
import { Store } from '@ngrx/store';
import { taskGroupActions } from '@core/store/task-group/actions/task-group.actions';
import { TaskActionDropdownService } from '@/app/dashboard/modules/task-page/services/task-action-dropdown.service';
import {
  ITaskRow,
  ITaskViewSettingsStatus
} from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import {
  ITaskFolder,
  ITaskGroup
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import { ETaskViewSettingsKey } from '@/app/dashboard/modules/task-page/utils/enum';
import { ICalendarEvent } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { BREAK_POINT_FOR_ASSIGNEE_COUNT } from '@/app/dashboard/modules/task-page/utils/constants';
import { FolderTaskListService } from '@/app/dashboard/modules/task-page/services/folder-task-list.service';

@DestroyDecorator
@Component({
  selector: 'task-row',
  templateUrl: './task-row.component.html',
  styleUrls: ['./task-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskRowComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('menu') dropdownMenu: ElementRef;
  @ViewChild('taskRow') taskRow: ElementRef;
  @ViewChild('trudiTextField') taskTitleInputElement: TrudiTextFieldComponent;
  isMenuDisplayed: boolean = false;
  @Input() set taskItem(value: ITaskRow) {
    this._taskItem$.next(value);
  }
  @Input() activeTaskList: string[] = [];
  @Input() index: number;
  @Input() search: string;
  @Input() taskViewSettings: ITaskViewSettingsStatus = null;
  @Input() innerWidth: number;
  @Output() removeItem = new EventEmitter<void>();
  @Output() checkedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() pressShiftClick = new EventEmitter();
  @Output() removeActiveTask = new EventEmitter();
  @Output() addSelectedTask = new EventEmitter();
  @Output() handleChangeTitleTask = new EventEmitter();
  @Output() navigateToNextTask = new EventEmitter<void>();
  @Output() navigateToPreviousTask = new EventEmitter<void>();
  @Output() menuChange = new EventEmitter<{
    task: ITaskRow;
    option: ETaskMenuOption | string;
    taskFolder?: ITaskFolder;
    taskGroup?: ITaskGroup;
  }>();
  @Output() openDrawer = new EventEmitter<ITaskRow>();

  private readonly destroy$ = new Subject();
  private readonly _taskItem$ = new BehaviorSubject<ITaskRow>({} as ITaskRow);
  public get taskItem() {
    return this._taskItem$.getValue();
  }
  public readonly taskItem$ = this._taskItem$.asObservable();

  public checked: boolean = false;
  public TaskStatusType = TaskStatusType;
  public TIME_NOW = TIME_NOW;
  public isConsole: boolean;
  public toolTipProperty: string;
  public readonly dateFormatPipe$ =
    this.agencyDateFormatService.dateFormatPipe$;
  public unReadTask = 0;
  public isAutoReopen = false;
  public queryParams: Params;
  public hasSelectedTask = false;
  public isEditTitle = false;
  public maxDisplayAssignee: number;
  public set _isEditTitle(value: boolean) {
    value ? this.taskTitle.enable() : this.taskTitle.disable();
    this.isEditTitle = value;
  }
  public titleBeforeChange: string = '';
  public taskTitle = new FormControl(null, [
    Validators.required,
    Validators.pattern(/^(?!^\s+$)^[\s\S]*$/)
  ]);
  public readonly ETaskMenuOption = ETaskMenuOption;
  public readonly ETaskViewSettingsKey = ETaskViewSettingsKey;
  public calenderWidgetExpiredDays: {
    [type: string]: number;
  };
  public currentCRMId: string;

  constructor(
    private taskService: TaskService,
    private taskGroupService: TaskGroupService,
    private router: Router,
    private inboxToolbarService: InboxToolbarService,
    public inboxService: InboxService,
    private sharedService: SharedService,
    private activatedRoute: ActivatedRoute,
    private propertiesService: PropertiesService,
    private agencyDateFormatService: AgencyDateFormatService,
    public inboxSidebarService: InboxSidebarService,
    public sharedMessageViewService: SharedMessageViewService,
    private nzContextMenuService: NzContextMenuService,
    private elementRef: ElementRef,
    private readonly store: Store,
    private taskActionDropdownService: TaskActionDropdownService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private folderTaskListService: FolderTaskListService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();

    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hasSelectedTask = !!res.length;
        this.checked = this.inboxToolbarService.isSelectedItem(
          this.taskItem.id
        );
        this.changeDetectorRef.markForCheck();
      });

    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.queryParams = res;
        this.changeDetectorRef.markForCheck();
      });

    this.isEditTitle ? this.taskTitle.enable() : this.taskTitle.disable();
    this.sharedMessageViewService.rightClicKSelectedMessageId$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((id) => {
        this.isMenuDisplayed = id === this.taskId;
        this.changeDetectorRef.markForCheck();
      });

    this.getCalenderWidgetExpiredDays();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (
      !this.elementRef.nativeElement?.contains(event.target) &&
      this.sharedMessageViewService.isRightClickDropdownVisibleValue
    ) {
      this.resetRightClickSelectedState();
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    if (
      !this.elementRef.nativeElement?.contains(event.target) &&
      this.sharedMessageViewService.isRightClickDropdownVisibleValue
    ) {
      this.resetRightClickSelectedState();
    }
  }

  @HostListener('keyup.enter', ['$event'])
  handleEnterKey(event: KeyboardEvent) {
    const target = event.target as Element;
    if (target.id === 'task-row-wrapper') {
      this.resetRightClickSelectedState();
      this.navigateToTaskDetail();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['taskItem']?.currentValue) {
      this.taskTitle.setValue(this.taskItem?.indexTitle);
      this.titleBeforeChange = this.taskItem?.indexTitle;
      // generate tooltip content for address
      const { status, propertyType } = this.taskItem.property || {};
      this.toolTipProperty = this.propertiesService.getTooltipPropertyStatus({
        propertyStatus: status,
        type: propertyType
      });
      const newUnReadTask =
        (this.taskItem.unreadConversations?.length || 0) +
        (this.taskItem.internalNoteUnreadCount || 0);
      if (this.unReadTask !== newUnReadTask) {
        this.unReadTask = newUnReadTask;
        this.changeDetectorRef.markForCheck();
      }
      if (this.isAutoReopen !== this.taskItem.isAutoReopen) {
        this.isAutoReopen = this.taskItem.isAutoReopen;
        this.changeDetectorRef.markForCheck();
      }
      this.taskItem = {
        ...this.taskItem,
        calendarEventPreview: [
          {
            calendarEvent: (this.taskItem?.calendarEvents?.[0] ??
              []) as ICalendarEvent
          }
        ]
      };
    }
    if (changes['innerWidth']?.currentValue) {
      this.maxDisplayAssignee =
        this.innerWidth < BREAK_POINT_FOR_ASSIGNEE_COUNT ? 2 : 3;
    }
  }

  getCalenderWidgetExpiredDays() {
    this.folderTaskListService.calenderWidgetExpiredDays$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.calenderWidgetExpiredDays = res;
        this.changeDetectorRef.markForCheck();
      });
  }

  onAssignAgentsSelectedClick(data: IAssignedAgentValue) {
    this.activatedRoute.queryParams.pipe(take(1)).subscribe((queryParams) => {
      if (queryParams) {
        const isFocused =
          queryParams[ETaskQueryParams.INBOXTYPE] === GroupType.MY_TASK;
        if (data?.isRemove && isFocused) {
          this.removeItem?.emit();
          this.taskService.activeTaskAssignId$.next(null);
        }
        this._taskItem$.next({
          ...this.taskItem,
          assignToAgents: data?.task.assignToAgents
        });
        this.store.dispatch(
          taskGroupActions.updateTask({
            task: this.taskItem
          })
        );
      }
    });
  }

  navigateToTaskDetail(queryParam = {}) {
    this.closeMenu();
    this.router
      .navigate(['dashboard', 'inbox', 'detail', this.taskItem?.id], {
        queryParams: {
          type: 'TASK',
          ...queryParam
        },
        queryParamsHandling: 'merge'
      })
      .then(() => {
        this.taskService?.setSelectedConversationList([]);
        this.inboxToolbarService?.setInboxItem([]);
      });
  }

  handleUpdateTaskIdQueryParam() {
    this.router
      .navigate([], {
        queryParams: {
          taskId: this.taskItem?.id
        },
        queryParamsHandling: 'merge'
      })
      .then(() => {
        this.taskService.setSelectedConversationList([]);
        this.inboxToolbarService.setInboxItem([]);
      });
    this.resetRightClickSelectedState();
  }

  handleChangeSelected(value: boolean) {
    if (this.isConsole) return;
    this.inboxToolbarService.inboxItem$
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe((inboxItems: ITaskRow[]) => {
        let listTaskId = inboxItems || [];
        this.checked = value;
        this.checkedChange.emit(value);
        if (value) {
          listTaskId.push(this.taskItem);
          this.addSelectedTask.emit({
            currentTaskId: this.taskItem.id,
            currentTaskIndex: this.index
          });
        } else {
          listTaskId = listTaskId.filter(
            (item) => item.id !== this.taskItem.id
          );
          this.removeActiveTask.emit(this.taskItem.id);
        }
        //if 1 task is selected => do nothing
        //if 2 tasks ...         => close menu if the menu is open;
        if (listTaskId.length >= 2) this.nzContextMenuService?.close();
        this.inboxToolbarService.setInboxItem(listTaskId);
        this.changeDetectorRef.markForCheck();
      });
    this.resetRightClickSelectedState();
  }

  onShiftClick(event: MouseEvent) {
    window.getSelection().removeAllRanges();
    const isKeepShiftCtr =
      (event.ctrlKey && event.shiftKey) || (event.metaKey && event.shiftKey);
    this.pressShiftClick.emit({ isKeepShiftCtr, lastIndex: this.index });
  }

  onCtrClick() {
    this.handleChangeSelected(!this.taskItem['checked']);
  }

  public handleEditTaskTitle(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this._isEditTitle = true;
    this.changeDetectorRef.markForCheck();
    this.taskGroupService.setEditMode(true);
    if (this.isEditTitle) this.handleFocus();
  }

  public handleFocus() {
    setTimeout(() => {
      if (this.taskTitleInputElement) {
        this.taskTitleInputElement.inputElem.nativeElement.focus();
      }
    });
  }

  get newTaskTitle() {
    return this.taskTitle?.value.trim();
  }

  get taskId() {
    return this.taskItem?.id;
  }

  saveEditTitle() {
    this._isEditTitle = false;
    this.changeDetectorRef.markForCheck();
    this.taskGroupService.setEditMode(false);
    if (!this.newTaskTitle || this.newTaskTitle === this.titleBeforeChange) {
      this.taskTitle.setValue(this.titleBeforeChange);
      return;
    }
    this.handleChangeTitleTask.emit({
      taskId: this.taskId,
      title: this.newTaskTitle
    });
    this.taskService
      .updateTaskTitle(this.taskId, this.newTaskTitle, this.newTaskTitle)
      .subscribe((res) => {
        if (res) {
          this._isEditTitle = false;
          this.titleBeforeChange = this.newTaskTitle;
          this.taskGroupService.setEditMode(false);
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  public handleBlurTaskGroup() {
    this._isEditTitle = false;
    this.changeDetectorRef.markForCheck();
    if (!this.newTaskTitle || this.newTaskTitle === '')
      this.taskTitle.setValue(this.titleBeforeChange);
    this.saveEditTitle();
  }

  async onRightClick(event: MouseEvent) {
    if (this.isConsole) return;
    event.preventDefault();

    // prevent create menu when more than 1 task is selected
    const taskList = await firstValueFrom(this.inboxToolbarService.inboxItem$);
    if (taskList?.length < 2) {
      this.sharedMessageViewService.setIsRightClickDropdownVisible(true);
      this.sharedMessageViewService.setRightClickSelectedMessageId(
        this.taskItem.id
      );

      const instance = this.taskActionDropdownService.create(
        event,
        this.taskItem
      );
      instance.menuChange
        .pipe(takeUntil(this.destroy$), take(1))
        .subscribe((res) => {
          this.menuChange.emit(res);
        });
    }
  }

  closeMenu(): void {
    this.nzContextMenuService.close();
    this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
    this.sharedMessageViewService.setRightClickSelectedMessageId('');
  }

  private handleClearSelected() {
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.taskService.setSelectedConversationList([]);
    this.inboxService.currentSelectedTaskTemplate$.next(null);
  }

  handleDeleteTask() {
    this.handleMenu(ETaskMenuOption.DELETE);
  }

  handleMenu(
    option: ETaskMenuOption | string,
    taskFolder?: ITaskFolder,
    taskGroup?: ITaskGroup
  ) {
    if (option !== ETaskMenuOption.DELETE) {
      this.handleClearSelected();
      this.taskItem.checked = false;
    }
    this.menuChange.emit({
      task: this.taskItem,
      option: option,
      taskFolder,
      taskGroup
    });
    this.closeMenu();
  }

  handleNavigateNextTask() {
    this.navigateToNextTask.emit();
  }

  handleNavigatePreTask() {
    this.navigateToPreviousTask.emit();
  }

  handleItemClick = (e: MouseEvent) => {
    e.stopPropagation();
    this.handleUpdateTaskIdQueryParam();
    this.openDrawer.emit(this.taskItem);
  };

  private resetRightClickSelectedState() {
    if (
      this.sharedMessageViewService.rightClickSelectedMessageIdValue ===
      this.taskId
    ) {
      this.nzContextMenuService.close();
      this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
      this.sharedMessageViewService.setRightClickSelectedMessageId('');
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
  }
}
