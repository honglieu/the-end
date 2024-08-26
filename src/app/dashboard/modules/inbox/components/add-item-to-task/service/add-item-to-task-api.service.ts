import { ApiService } from '@/app/services/api.service';
import { conversations } from '@/environments/environment';
import { Injectable } from '@angular/core';
import { EStateModalAddToTask } from '@/app/dashboard/modules/inbox/components/add-item-to-task/add-item-to-task.component';

@Injectable()
export class AddItemToTaskApiService {
  constructor(private apiService: ApiService) {}

  linkedActionToTask(payload, type) {
    const payloadAddToExistingTask = {
      taskId: payload?.taskId ? payload?.taskId : '',
      isLinked: payload?.isLinked,
      actionName: payload.actionName,
      actionRequestId: payload?.actionRequestId
    };
    const payloadCreateTask = {
      taskNameId: payload?.taskNameId,
      propertyId: payload?.propertyId,
      assignedUserIds: payload?.assignedUserIds,
      taskTitle: payload?.taskTitle,
      taskNameTitle: payload?.taskNameTitle,
      notificationId: payload?.notificationId,
      mailBoxId: payload?.mailBoxId,
      taskFolderId: payload?.taskFolderId,
      taskGroupId: payload?.taskGroupId,
      agencyId: payload?.agencyId,
      indexTitle: payload?.indexTitle,
      ...payloadAddToExistingTask
    };

    return this.apiService.postAPI(
      conversations,
      'task/linked-action-to-task',
      EStateModalAddToTask.createTask === type
        ? payloadCreateTask
        : payloadAddToExistingTask
    );
  }
}
