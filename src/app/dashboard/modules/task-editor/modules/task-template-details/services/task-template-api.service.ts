import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import {
  ITaskTemplate,
  IUpdateTaskTemplate
} from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { conversations } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskTemplateApiService {
  constructor(private apiService: ApiService) {}

  getTaskTemplateDetail(taskTemplateId: string): Observable<ITaskTemplate> {
    return this.apiService.getAPI(
      conversations,
      `task-management/task-templates/${taskTemplateId}`
    );
  }

  updateTaskTemplate(
    taskTemplateId: string,
    body: IUpdateTaskTemplate,
    isConsole: boolean
  ) {
    return this.apiService.putAPI(
      conversations,
      `task-management${
        isConsole ? '/console' : ''
      }/task-templates/${taskTemplateId}`,
      body
    );
  }
}
