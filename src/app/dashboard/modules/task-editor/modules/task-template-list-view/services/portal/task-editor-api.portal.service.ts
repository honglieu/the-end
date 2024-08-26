import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import { ETaskTemplateStatus } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import {
  ITaskEditorTemplateRequest,
  IUpdateTaskTemplate,
  TaskEditorTemplate,
  TaskTemplateId
} from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';

@Injectable()
export class PortalTaskEditorApiService {
  constructor(private apiService: ApiService) {}

  getListTaskEditor(
    payload: ITaskEditorTemplateRequest
  ): Observable<TaskEditorTemplate> {
    return this.apiService.postAPI(
      conversations,
      'task-management/task-templates/list',
      payload
    );
  }

  changeTaskStatusMultipleTemplate(
    taskTemplates: TaskTemplateId[],
    status: ETaskTemplateStatus
  ) {
    return this.apiService.postAPI(
      conversations,
      'task-management/task-templates/change-status-multiple',
      {
        taskTemplates,
        status
      }
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

  createNewTaskEditor(body: IUpdateTaskTemplate) {
    return this.apiService.postAPI(
      conversations,
      'task-management/task-templates/fork-template',
      body
    );
  }
}
