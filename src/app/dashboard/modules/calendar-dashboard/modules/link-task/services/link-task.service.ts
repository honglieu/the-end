import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { handleFormatDataListTaskMove } from '@shared/feature/function.feature';
import { NewTaskOptions, TaskList } from '@shared/types/task.interface';
import { conversations } from 'src/environments/environment';

@Injectable()
export class LinkTaskService {
  constructor(private apiService: ApiService) {}

  public linkTaskToEvent(
    payload: LinkEventPayload
  ): Observable<LinkEventResponse[]> {
    return this.apiService.postAPI(conversations, 'link-event-task', payload);
  }

  mergeListTaskData(oldList: TaskList, data: TaskList) {
    const dataFormat: TaskList = handleFormatDataListTaskMove(data.data);
    const isEmpty = this.areAllArraysEmpty(oldList);
    if (!oldList || isEmpty) {
      return dataFormat;
    } else {
      return {
        my_task: oldList.my_task?.concat(dataFormat.my_task),
        team_task: oldList.team_task?.concat(dataFormat.team_task),
        completed: oldList.completed?.concat(dataFormat.completed),
        deleted: oldList.deleted?.concat(dataFormat.deleted),
        my_task_and_team_task: oldList.hasOwnProperty('my_task_and_team_task')
          ? oldList.my_task_and_team_task?.concat(
              dataFormat.my_task_and_team_task
            )
          : []
      };
    }
  }

  areAllArraysEmpty(obj) {
    return Object.values(obj || []).every(
      (arr) => Array.isArray(arr) && arr.length === 0
    );
  }
}

export interface LinkEventPayload {
  taskId: string;
  calendarEventIds: string[];
}

export interface LinkEventResponse {
  id: string;
  linkedTasks?: ILinkedTasks[];
  latestLinkedTask?: ILatestLinkedTask;
  totalLinkedTask?: number;
}

export interface ILinkedTasks {
  id: string;
  status: string;
  title: string;
  createdAt: string;
}

export interface ILatestLinkedTask {
  taskId: string;
  task: ITask;
}

export interface ITask {
  id: string;
  title: string;
  createdAt?: string;
}

export interface CreateNewTaskPayload {
  taskId: string;
  taskNameRegionId: string;
  propertyId: string;
  assignedUserIds: string[];
  options?: NewTaskOptions;
  taskNameTitle?: string;
  eventId?: string;
  isCreateBlankTask?: boolean;
  taskTitle: string;
  indexTitle: string;
  notificationId?: string;
}
