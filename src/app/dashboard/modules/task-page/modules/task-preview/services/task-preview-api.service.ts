import { ITaskPreviewPayload } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskPreviewApiService {
  constructor(private apiService: ApiService) {}
  getDataTaskPreview(body: ITaskPreviewPayload) {
    return this.apiService.postAPI(
      conversations,
      'tasks/get-data-for-task-panel',
      body
    );
  }
}
