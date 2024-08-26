import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { conversations, agencies } from 'src/environments/environment';
import {
  ICalendarEventType,
  ITaskEditorTemplateRequest,
  TaskEditorTemplate
} from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';

@Injectable()
export class TaskEditorApiService {
  constructor(private apiService: ApiService) {}
  public calendarEventType: BehaviorSubject<ICalendarEventType[]> =
    new BehaviorSubject(null);

  getListTaskEditor(
    payload: ITaskEditorTemplateRequest
  ): Observable<TaskEditorTemplate> {
    return this.apiService.postAPI(
      conversations,
      'task-management/task-templates/list',
      payload
    );
  }

  referenceTemplates(templateIds: string[]) {
    return this.apiService.postAPI(
      conversations,
      'task-management/reference-templates',
      {
        templateIds
      }
    );
  }

  getCalendarEvent(crmSystemId: string = '') {
    return this.apiService.getAPI(
      agencies,
      `get-calendar-event-types?crmSystemId=${crmSystemId}`
    );
  }
}
