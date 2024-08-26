import { map } from 'rxjs';
import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import { IGetInfoTasksForPrefillDynamicBody } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { TaskItem } from '@shared/types/task.interface';
import {
  IGetTasksByGroupPayload,
  ITaskGroup
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskApiService {
  constructor(private apiService: ApiService) {}

  sortListDescByConversation(list: TaskItem[]) {
    return list.sort((a, b) => {
      const messageDateA = new Date(a.conversations?.[0]?.updatedAt) as any;
      const messageDateB = new Date(b.conversations?.[0]?.updatedAt) as any;
      return messageDateB - messageDateA;
    });
  }

  getTaskById(taskId: string) {
    return this.apiService
      .getData<TaskItem>(`${conversations}task?taskId=${taskId}`)
      .pipe(map((response) => response.body));
  }

  getInfoTasksForPrefillDynamicParam(body: IGetInfoTasksForPrefillDynamicBody) {
    return this.apiService.postAPI(
      conversations,
      'get-dynamic-fields-data',
      body
    );
  }

  getTasksByGroup(body: IGetTasksByGroupPayload) {
    return this.apiService.postAPI(conversations, 'tasks/v2/get-tasks', body);
  }

  updateTaskGroup(payload: Partial<ITaskGroup>[]) {
    return this.apiService.putAPI(
      conversations,
      'tasks/v2/task-group',
      payload
    );
  }

  assignDefaultGroup(payload: { taskGroupId: string; taskFolderId: string }) {
    return this.apiService.postAPI(
      conversations,
      'tasks/v2/task-group/assign-default',
      payload
    );
  }

  createTaskGroup(body: {
    taskFolderId: string;
    name: string;
    color: string;
    order: number;
  }) {
    return this.apiService.postAPI(conversations, 'tasks/v2/task-group', body);
  }

  deleteTaskGroup(id: string) {
    return this.apiService.deleteAPI(
      conversations,
      'tasks/v2/task-group/' + id
    );
  }
  permanentlyDeleteTasks(taskIds: string[]) {
    return this.apiService.postAPI(
      conversations,
      'tasks/permanently-delete-tasks',
      {
        taskIds
      }
    );
  }

  getPreviousTaskFolder(taskId: string) {
    return this.apiService.getAPI(
      conversations,
      `tasks/get-previous-task-folder/${taskId}`
    );
  }
}
