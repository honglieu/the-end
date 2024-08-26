import { ErrorMessages } from '@services/constants';
import { checkScheduleMsgCount } from '@/app/trudi-send-msg/utils/helper-functions';
import {
  CdkDragDrop,
  CdkDragMove,
  moveItemInArray
} from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Optional } from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { catchError, map, of, tap } from 'rxjs';
import { IGetTaskByFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import { TaskService } from '@services/task.service';
import { TaskStatusType } from '@shared/enum/task.enum';

@Injectable()
export class TaskDragDropService {
  public dragInfo: DragInfo = {} as DragInfo;
  public indicator: Element;
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Optional() private taskApiService: TaskApiService,
    private taskService: TaskService
  ) {}

  @debounce(50)
  public setDragInfo(
    event: CdkDragMove<unknown>,
    dragType: ListViewDraggableItem,
    groupId?: string,
    isSelected?: boolean
  ) {
    this.clearDragInfo();
    if (dragType === ListViewDraggableItem.TASK_GROUP) {
      this.setDragGroupInfo(event);
    }
    if (dragType === ListViewDraggableItem.TASK_ROW) {
      this.setDragTaskRowInfo(event, groupId, isSelected);
    }
  }

  public setDragGroupInfo(event: CdkDragMove<unknown>) {
    const group = this.getRootElement(
      event.pointerPosition,
      ListViewDraggableItem.TASK_GROUP
    );
    const isDragAfterCompletedGroup = group.classList.contains(
      'completed-group-data-wrapper'
    );
    if (group && !isDragAfterCompletedGroup) {
      this.dragInfo.activeElement = group;
      const position = this.calculateDropPosition(group, event.pointerPosition);
      this.dragInfo.position = position;
      this.addIndicator(group);
    }
  }

  public setDragTaskRowInfo(
    event: CdkDragMove<unknown>,
    groupId: string,
    isSelected: boolean = false
  ) {
    const activeElement = this.getRootElement(
      event.pointerPosition,
      ListViewDraggableItem.TASK_GROUP
    );
    if (activeElement) {
      const isGroup = activeElement.classList.value.includes(
        ListViewDraggableItem.TASK_GROUP
      );
      if (isGroup) {
        this.dragInfo.activeElement = activeElement;
        this.dragInfo.position = 'inside';
        this.dragInfo.currentGroupId = groupId;
        if (!isSelected) this.highlightGroup(activeElement);
      }
    }
  }

  public clearDragInfo() {
    if (this.indicator) this.indicator.remove();
    this.dragInfo = {
      activeElement: null,
      currentIndex: null,
      newIndex: null,
      position: null,
      currentGroupId: null
    };
    const elements = this.document.querySelectorAll(
      `.${ACTIVE_TASK_GROUP_CLASS}`
    );
    elements.forEach((element) => {
      element.classList.remove(ACTIVE_TASK_GROUP_CLASS);
    });
  }

  handleDropTask(event: CdkDragDrop<ITaskRow | IGetTaskByFolder>) {
    const currentGroupId = this.dragInfo?.currentGroupId;
    const newGroupId = this.dragInfo?.activeElement?.getAttribute('group-id');

    const taskItem = event.item.data as ITaskRow;
    const dragGroupStatus = !!(
      event.container.data as unknown as IGetTaskByFolder[]
    )?.find((item) => item.taskGroup.id === newGroupId)?.taskGroup
      .isCompletedGroup
      ? TaskStatusType.completed
      : TaskStatusType.inprogress;

    this.clearDragInfo();
    if (!newGroupId || newGroupId === currentGroupId) return of(null);
    if (
      [TaskStatusType.completed, TaskStatusType.deleted].includes(
        dragGroupStatus
      ) &&
      checkScheduleMsgCount(taskItem.conversations)
    ) {
      const errorMessages = TaskStatusType.completed
        ? ErrorMessages.RESOLVE_TASK
        : ErrorMessages.DELETE_TASK;
      return of({
        currentGroupId: null,
        newGroupId: null,
        errorMessages
      } as any);
    }
    return this.taskService
      .updateTask({
        taskIds: [taskItem.id],
        status: dragGroupStatus,
        taskGroupId: newGroupId,
        mailBoxId: this.taskService.currentMailBoxId
      })
      .pipe(catchError(() => of(null)))
      .pipe(
        map((data) => {
          if (data) return { currentGroupId, newGroupId };
          return null;
        })
      );
  }

  handleDropGroup(
    event: CdkDragDrop<IGetTaskByFolder>,
    groups: IGetTaskByFolder[]
  ) {
    if (!this.dragInfo.activeElement) return of(null);
    const index = (event.item.data as IGetTaskByFolder).taskGroup.order - 1;
    const dragIndex =
      Number(this.dragInfo['activeElement']?.getAttribute('drag-index')) - 1 ||
      0;
    const realDragIndex = this.getDragDestinationIndex(
      this.dragInfo,
      index,
      dragIndex
    );
    this.clearDragInfo();

    if (index === realDragIndex) return of(null);
    let mappedTaskGroups = cloneDeep(groups);
    moveItemInArray(mappedTaskGroups, index, realDragIndex);
    mappedTaskGroups = mappedTaskGroups.map((item, index) => {
      const newTaskGroup = item.taskGroup;
      newTaskGroup.order = index + 1;
      return {
        ...item,
        taskGroup: newTaskGroup
      };
    });
    return this.taskApiService
      .updateTaskGroup(
        mappedTaskGroups.map((item, index) => ({
          id: item.taskGroup.id,
          order: item.taskGroup.order
        }))
      )
      .pipe(tap(() => this.clearDragInfo()))
      .pipe(catchError(() => of(false)))
      .pipe(
        map((data) => {
          if (data) return mappedTaskGroups;
          return null;
        })
      );
  }

  public getRootElement(
    pointerPosition: { x: number; y: number },
    rootClassName: string
  ) {
    const element = this.document.elementFromPoint(
      pointerPosition.x,
      pointerPosition.y
    );
    const rootElement =
      element?.closest(`.${rootClassName}`) ||
      element?.querySelector(`${rootClassName}`);
    return rootElement;
  }

  public calculateDropPosition(
    element: Element,
    pointerPosition: { x: number; y: number }
  ) {
    const elementBounding = element.getBoundingClientRect();
    const halfOfHeight = elementBounding.height / 2;

    const { y } = pointerPosition;
    let position: DragPosition;
    if (y >= elementBounding.top && y <= elementBounding.top + halfOfHeight) {
      position = 'before';
    } else {
      position = 'after';
    }
    return position;
  }

  public addIndicator(element: Element) {
    if (this.dragInfo.position === 'before') {
      this.indicator = element.insertAdjacentElement(
        'beforebegin',
        this.buildIndicator()
      );
    } else {
      this.indicator = element.insertAdjacentElement(
        'afterend',
        this.buildIndicator()
      );
    }
  }

  public buildIndicator() {
    const div = document.createElement('div');
    div.classList.add('drag-drop-indicator');
    return div;
  }

  private getDragDestinationIndex(
    dragInfo: DragInfo,
    currentIndex: number,
    activeIndex: number
  ) {
    if (dragInfo.position === 'after') {
      return currentIndex < activeIndex ? activeIndex : activeIndex + 1;
    }
    if (dragInfo.position === 'before') {
      return currentIndex < activeIndex ? activeIndex - 1 : activeIndex;
    }
    return activeIndex;
  }

  private highlightGroup(group: Element) {
    group.classList.add(ACTIVE_TASK_GROUP_CLASS);
  }
}

export interface DragInfo {
  currentIndex?: number;
  newIndex?: number;
  position?: DragPosition;
  activeElement?: Element;
  currentGroupId?: string;
}

type DragPosition = 'before' | 'after' | 'inside';

export enum ListViewDraggableItem {
  TASK_GROUP = 'draggable-task-group',
  TASK_ROW = 'task-row'
}

export function debounce(timeout: number): MethodDecorator {
  let timeoutRef = null;

  return function (
    _target,
    _key: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const { value } = descriptor;

    descriptor.value = function (...args: unknown[]) {
      clearTimeout(timeoutRef);
      timeoutRef = setTimeout(() => value.apply(this, args), timeout);
    };

    return descriptor;
  };
}

const ACTIVE_TASK_GROUP_CLASS = 'task-group__drop-active';
