import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import { IUpdateTaskTemplate } from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';

@Injectable({
  providedIn: 'root'
})
export class ConsoleCreateFromScratchService {
  constructor(private apiService: ApiService) {}

  createNewTaskEditor(body: IUpdateTaskTemplate) {
    return this.apiService.postAPI(
      conversations,
      'task-management/console/task-templates',
      body
    );
  }
}
