import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { ImgPath } from '@shared/enum/share.enum';
import {
  TaskConvertPrefill,
  TaskConvertPrefillService
} from '@/app/task-detail/services/task-convert-prefill.service';
import { TaskType } from '@shared/enum/task.enum';
import { Regions } from '@shared/types/trudi.interface';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { TaskService } from './../../../services/task.service';
import { TaskItemDropdown, TaskName } from './../../types/task.interface';
import { defaultConfigs } from '@/app/mailbox-setting/utils/out-of-office-config';
import { IConfigs } from '@/app/mailbox-setting/utils/out-of-office.interface';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';

@Component({
  selector: 'convert-to-task-dropdown',
  templateUrl: './convert-to-task-dropdown.component.html',
  styleUrls: ['./convert-to-task-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConvertToTaskDropdownComponent
  implements OnInit, OnChanges, OnDestroy
{
  @ViewChild('dropdownBtn') dropdownBtn: ElementRef;
  @ViewChild('inputSelectTask') inputSelectTask: ElementRef;
  @ViewChild('dropdownBox') dropdownBox: ElementRef;
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;

  @Input() listConvertToTask: TaskName[] = [];
  @Input() listTaskName: TaskName[] = [];
  @Input() isShowCreateTaskBtn = true;
  @Input() isError = false;
  @Input() noPrefill = false;
  @Input() taskDetailViewMode: EViewDetailMode = EViewDetailMode.TASK;
  @Output() getSelectedTask = new EventEmitter<TaskName>();
  public activeProperty: UserPropertyInPeople[];
  public selectedTask: TaskName;
  public showDropdown: boolean = false;
  public newTaskPopupState: boolean = false;
  public ModalPopupPosition = ModalPopupPosition;
  public ImgPath = ImgPath;
  public searchInput = new FormControl();
  public searchingTask: TaskName[] = [];
  public searchText: string;
  public taskType = TaskType;
  public createTaskByCateType = CreateTaskByCateOpenFrom;
  public taskGroupList = {};
  public searchingTaskGroupList = {};
  public listOtherConvertToTask = [];
  public groupList = new Set([]);
  public currentTaskRegion: Regions;
  public configs: IConfigs = {
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      showDropdown: false
    }
  };

  private unsubscribe = new Subject<void>();
  private listenerClickDropdownTask: () => void;
  private hasChangeValueManually = new Subject<boolean>();
  private onListConvertToTaskChange = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private propertyService: PropertiesService,
    private agencyService: AgencyService,
    private conversationService: ConversationService,
    private renderer: Renderer2,
    private taskConvertPrefillService: TaskConvertPrefillService,
    private cdr: ChangeDetectorRef
  ) {
    this.listenerClickDropdownTask = this.renderer.listen(
      'window',
      'click',
      (e: Event) => {
        if (
          e.target !== this.dropdownBtn?.nativeElement &&
          e.target !== this.inputSelectTask?.nativeElement
        ) {
          this.showDropdown = false;
          this.searchingTask = this.hanldeMapList(this.listTaskName);
          this.searchInput.setValue('');
          this.searchInput.setValue(
            this.selectedTask?.name || this.selectedTask?.label,
            { emitEvent: false }
          );
        }
      }
    );
  }

  ngOnChanges(): void {
    if (this.listTaskName?.length) this.getOtherTaskList();
  }

  async ngOnInit() {
    this.propertyService.newCurrentProperty
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged((pre, curr) => pre?.id === curr?.id)
      )
      .subscribe((result) => {
        if (!result) return;
        this.propertyService.currentTaskRegion.next({
          id: result?.regionId,
          name: result?.state
        });
      });

    this.propertyService.currentTaskRegion
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((region) => {
        const _ = region && (this.currentTaskRegion = region);
        if (this.listTaskName?.length) {
          this.getOtherTaskList();
        }
        this.taskConvertPrefillService.patchPrefillContent({
          region,
          operationMode: 'manual'
        });
      });

    this.agencyService.listTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.getOtherTaskList();
      });

    this.onSearchInpuChanges();

    this.subscribeToPrefillContentChanges();
  }

  public onDropdownClick(inputClick = false) {
    this.showDropdown = inputClick || !this.showDropdown;
    const selectedIndex = this.listOtherConvertToTask.findIndex(
      (task) =>
        task?.taskNameRegion?.taskNameRegionId ===
        this.selectedTask?.taskNameRegion?.taskNameRegionId
    );
    if (selectedIndex > -1 && this.showDropdown) {
      this.viewport?.scrollToIndex(selectedIndex - 1);
    }
    this.searchInput.setValue(
      this.selectedTask?.name || this.selectedTask?.label,
      { emitEvent: false }
    );
  }

  public onItemClick(task: TaskName, event?: MouseEvent) {
    if (event?.target && this.isSelectedItemChanged(this.selectedTask, task)) {
      this.hasChangeValueManually.next(true);
      this.hasChangeValueManually.complete();
    }
    this.isError = false;
    this.selectedTask = task;
    this.getSelectedTask.emit(task);
    this.searchInput.setValue('');
    this.searchInput.setValue(task?.name || task?.label, { emitEvent: false });
    this.showDropdown = false;
  }

  public onCreateBlankTask() {
    this.newTaskPopupState = !this.newTaskPopupState;
    this.propertyService
      .getAgencyProperty(
        this.conversationService.currentConversation?.value?.userId,
        this.taskService.currentTask$.value?.property.id
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.activeProperty = res;
        }
      });
  }

  private onSearchInpuChanges() {
    this.searchInput?.valueChanges
      .pipe(takeUntil(this.unsubscribe), debounceTime(300))
      .subscribe((value) => {
        this.searchText = value;
        const filterTask = this.listTaskName.filter((task) => {
          const checkValue = task?.name || task?.label;
          return checkValue.toLowerCase()?.includes(value.toLowerCase());
        });
        this.searchingTask = this.hanldeMapList(
          value ? filterTask : this.listTaskName
        );
        this.searchingTask = this.taskService.filterTasksByRegion(
          this.searchingTask,
          this.currentTaskRegion?.id,
          true,
          this.currentTaskRegion?.name
        );
        this.searchingTask = this.handleConverTaskNameList(this.searchingTask);
        this.listOtherConvertToTask = this.handleGroupTask(this.searchingTask);
        this.cdr.markForCheck();
      });
  }

  private isSelectedItemChanged(currentValue: TaskName, newValue: TaskName) {
    return currentValue?.id != newValue?.id;
  }

  private getOtherTaskList() {
    this.searchInput?.setValue('');
    let listTaskName = this.hanldeMapList(this.listTaskName);
    let otherTasks = this.taskService.filterTasksByRegion(
      listTaskName,
      this.currentTaskRegion?.id,
      true,
      this.currentTaskRegion?.name
    );
    otherTasks = this.handleConverTaskNameList(otherTasks);
    this.listOtherConvertToTask = this.handleGroupTask(otherTasks);
    this.onListConvertToTaskChange.next();
  }

  private subscribeToPrefillContentChanges() {
    this.taskConvertPrefillService.allowSetPrefillContent();

    const checkContentByOperationMode = (
      content: TaskConvertPrefill | null,
      operationMode: typeof content.operationMode
    ) => content?.taskName && content?.operationMode == operationMode;

    const prefillContent$ = this.onListConvertToTaskChange.asObservable().pipe(
      switchMap(() => this.taskConvertPrefillService.prefillContent$),
      takeUntil(this.hasChangeValueManually)
    );

    const hasAutoSetPrefillContent$ = new Subject<void>();

    // Trigger on API get message history on app-chat.component
    prefillContent$.pipe(takeUntil(hasAutoSetPrefillContent$)).subscribe({
      next: (content) => {
        if (checkContentByOperationMode(content, 'auto')) {
          this.prefillContent(content);
          hasAutoSetPrefillContent$.next();
          hasAutoSetPrefillContent$.complete();
        }
      }
    });

    // Trigger on user focus on tiny editor
    prefillContent$.pipe(takeUntil(this.hasChangeValueManually)).subscribe({
      next: (content) => {
        if (checkContentByOperationMode(content, 'manual')) {
          this.prefillContent(content);
        }
      },
      complete: () => {
        this.taskConvertPrefillService.setPrefillContent(null);
        this.taskConvertPrefillService.preventSetFrefillContent();
      }
    });
  }

  private prefillContent(content: TaskConvertPrefill | null) {
    if (!content?.taskName) return;

    const tasks = Object.values<TaskName>(
      this.listOtherConvertToTask || this.listTaskName || []
    ).flat();

    let selectedTask = null;

    for (const task of tasks) {
      const taskName = task?.label || task?.name;
      if (taskName?.toLowerCase().includes(content.taskName?.toLowerCase())) {
        const taskRegionId = task?.taskNameRegion?.regionId;
        if (taskRegionId && taskRegionId == content.region?.id) {
          selectedTask = { ...task };
          break;
        } else {
          selectedTask = { ...task };
        }
      }
    }

    if (selectedTask) {
      if (this.taskDetailViewMode === EViewDetailMode.MESSAGE) {
        this.getSelectedTask.emit(selectedTask);
      } else {
        this.onItemClick(selectedTask);
      }
    }
  }

  private handleConverTaskNameList(
    listTaskName: TaskItemDropdown[] | TaskName[]
  ) {
    return listTaskName?.map((task) => {
      if (task.value) return { ...task, topicId: task.value.topicId };
      else return { ...task };
    });
  }

  private hanldeMapList(tasks: TaskName[]): TaskName[] {
    return tasks?.filter((it) => {
      if (it?.isEnable !== undefined) {
        return it.isEnable;
      }
      if (it?.disabled !== undefined) {
        return !it?.disabled;
      }
      return it;
    });
  }

  private handleGroupTask(taskList: TaskName[]) {
    if (!taskList?.length) return [];
    const newListTask = [];
    newListTask.push({
      groupName: taskList[0]['group'],
      topicId: taskList[0].topicId
    });
    for (let i = 0; i < taskList.length; i++) {
      const currentItem = taskList[i];
      const prevItem = taskList[i - 1];
      if (prevItem && currentItem.topicId !== prevItem.topicId) {
        newListTask.push({
          groupName: currentItem['group'],
          topicId: currentItem.topicId
        });
      }
      newListTask.push(currentItem);
    }
    return newListTask;
  }

  private handleConvertTaskNameList(
    listTaskName: TaskItemDropdown[] | TaskName[]
  ) {
    return listTaskName.map((item) => {
      if (item.value) return { ...item, topicId: item.value.topicId };
      return { ...item };
    });
  }

  onClearInput(event: Event) {
    event.stopPropagation();
    this.searchInput?.setValue('');
    this.selectedTask = null;
    this.getSelectedTask.emit(null);
  }

  ngOnDestroy() {
    if (typeof this.listenerClickDropdownTask == 'function') {
      this.listenerClickDropdownTask();
    }
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.hasChangeValueManually.next(false);
    this.hasChangeValueManually.complete();
  }
}
