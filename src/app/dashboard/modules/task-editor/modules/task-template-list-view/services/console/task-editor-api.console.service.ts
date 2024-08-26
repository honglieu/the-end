import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import {
  ITaskEditorTemplateRequest,
  IUpdateTaskTemplate,
  TaskEditorTemplate,
  TaskTemplateId
} from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { Observable } from 'rxjs';
import { agencies, conversations } from 'src/environments/environment';
import { ETaskTemplateStatus } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';

@Injectable({
  providedIn: 'root'
})
export class ConsoleTaskEditorApiService {
  constructor(private apiService: ApiService) {}

  getListTaskEditor(
    payload: ITaskEditorTemplateRequest
  ): Observable<TaskEditorTemplate> {
    return this.apiService.postAPI(
      conversations,
      'task-management/console/task-templates/list',
      payload
    );
  }

  changeTaskStatusMultipleTemplate(
    taskTemplates: TaskTemplateId[],
    status: ETaskTemplateStatus
  ) {
    return this.apiService.postAPI(
      conversations,
      'task-management/console/task-templates/change-status-multiple',
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

  getCrmSystem() {
    return this.apiService.getAPI(agencies, 'get-crm-systems');
  }

  createNewTaskEditor(body: IUpdateTaskTemplate) {
    return this.apiService.postAPI(
      conversations,
      'task-management/console/task-templates/fork-template',
      body
    );
  }
}
