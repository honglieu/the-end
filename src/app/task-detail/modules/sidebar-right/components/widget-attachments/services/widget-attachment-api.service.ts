import { ApiService } from '@/app/services/api.service';
import { conversations } from '@/environments/environment';
import { Injectable } from '@angular/core';

@Injectable()
export class WidgetAttachmentApiService {
  constructor(private apiService: ApiService) {}
  linkAttachmentToTask(files: any[], taskId: string, propertyId: string) {
    return this.apiService.postAPI(conversations, 'task/upload-files', {
      files,
      taskId,
      propertyId
    });
  }
}
