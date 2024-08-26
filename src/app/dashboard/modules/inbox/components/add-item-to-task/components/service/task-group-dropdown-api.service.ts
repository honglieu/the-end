import { Injectable } from '@angular/core';
import { SearchTask } from '@shared/types/task.interface';
import { conversations } from 'src/environments/environment';
import { ApiService } from '@/app/services/api.service';

@Injectable()
export class TaskGroupDropdownApiService {
  constructor(private apiService: ApiService) {}

  getListTaskFolder(payload) {
    return this.apiService.postAPI(
      conversations,
      'tasks/v2/get-list-tasks',
      payload
    );
  }

  prepareMoveToTaskData(
    searchTask: SearchTask = {
      term: '',
      onlyMyTasks: false,
      onlyInprogress: false,
      pageIndex: 0,
      propertyIds: [],
      taskIds: [],
      isIgnoreTaskLinkedAction: false,
      conversationType: null
    },
    mailBoxId: string
  ) {
    let payload = {
      mailBoxId,
      propertyIds: searchTask.propertyIds,
      ...(searchTask.taskFolderId && { taskFolderId: searchTask.taskFolderId }),
      search: searchTask.term,
      conversationType: searchTask.conversationType,
      isIgnoreTaskLinkedAction: searchTask.isIgnoreTaskLinkedAction,
      taskIds: searchTask.taskIds,
      ...(searchTask.onlyInprogress
        ? {
            isMySelfTask: searchTask.onlyMyTasks,
            isCompleted: false
          }
        : {
            isCompleted: true,
            pageIndex: searchTask.pageIndex,
            pageSize: 10
          })
    };

    return this.getListTaskFolder(payload);
  }
}
