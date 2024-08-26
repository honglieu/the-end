import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';

@Injectable()
export class TaskDragDropApiService {
  constructor(private apiService: ApiService) {}
  public moveTaskToGroup(payload: MoveTaskToGroupPayload) {
    return this.apiService.postAPI(conversations, 'tasks', payload);
  }
}

export interface MoveTaskToGroupPayload {
  taskId: string;
  groupId: string;
}
