import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { TaskService } from '@services/task.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { BreachNoticeRemedyCardBody } from '@shared/types/trudi.interface';
import { conversations, properties } from 'src/environments/environment';
import { INoteSync } from '@/app/breach-notice/utils/breach-notice.type';
import {
  BreachNoticeRequestButtonAction,
  BreachNoticeStepIndex
} from '@/app/breach-notice/utils/breach-notice.enum';

import { ReiFormData } from '@shared/types/rei-form.interface';
import { AgencyService } from '@/app/dashboard/services/agency.service';

@Injectable({
  providedIn: 'root'
})
export class BreachNoticeApiService {
  constructor(
    private apiService: ApiService,
    private taskService: TaskService,
    private agencyService: AgencyService
  ) {}

  getCategory() {
    return this.apiService.getAPI(
      conversations,
      `breach-notice/get-list-category`
    );
  }

  getListOfUserProperty() {
    return this.apiService.getAPI(
      properties,
      `list-of-userProperty/${this.taskService.currentTask$.value.property.id}`
    );
  }

  updateBreachRemedy(body: BreachNoticeRemedyCardBody, isTaskEditor = false) {
    return this.apiService.putAPI(
      conversations,
      `${
        isTaskEditor
          ? 'breach-notice/update-breach-remedy-date-task-editor'
          : 'breach-notice/update-breach-remedy-date'
      }/${this.taskService.currentTask$.value.id}`,
      body
    );
  }

  updateBreachRemedyEvent(eventId: string) {
    return this.apiService.putAPI(
      conversations,
      `breach-notice/update-status-event/${eventId}`
    );
  }

  updateBreachNoticeReiFormInfo(
    taskId: string,
    action: string,
    reiFormInfo: ReiFormData,
    buttonIndex: BreachNoticeStepIndex
  ) {
    return this.apiService.postAPI(
      conversations,
      'breach-notice/update-rei-form-info',
      { taskId, action, reiFormInfo, buttonIndex }
    );
  }

  updateButtonStatus(
    action: BreachNoticeRequestButtonAction,
    status: TrudiButtonEnumStatus,
    buttonIndex: BreachNoticeStepIndex
  ) {
    return this.apiService.postAPI(
      conversations,
      'breach-notice/update-button-status',
      {
        taskId: this.taskService.currentTask$.value.id,
        action,
        status,
        buttonIndex
      }
    );
  }

  addNoteSyncPT(payload: INoteSync) {
    return this.apiService.postAPI(
      conversations,
      'breach-notice/add-note-to-pt',
      {
        taskId: this.taskService.currentTask$.value.id,
        ...payload
      }
    );
  }

  updateNoteSyncPT(payload: INoteSync) {
    return this.apiService.putAPI(
      conversations,
      `breach-notice/update-note-to-pt/${this.taskService.currentTask$.value.id}`,
      payload
    );
  }
}
