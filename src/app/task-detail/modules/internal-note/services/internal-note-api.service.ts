import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import {
  IPayloadEditNote,
  IPayloadSendNote,
  ISyncDocumentPayload
} from '@/app/task-detail/modules/internal-note/utils/internal-note.interface';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InternalNoteApiService {
  constructor(private apiService: ApiService) {}

  getDataInternalNote(taskId) {
    return this.apiService
      .getData<any>(`${conversations}task/preview-internal-note/${taskId}`)
      .pipe(map((response) => response.body));
  }

  getListInternalNoteByTask(
    taskId: string,
    friendlyId: string,
    type: string = null
  ) {
    let queryString = `task/internal-notes/${taskId}?limit=20`;
    if (friendlyId) queryString += `&friendlyId=${friendlyId}`;
    if (type) queryString += `&type=${type}`;
    return this.apiService.getAPI(conversations, queryString);
  }

  sendInternalNote(payload: IPayloadSendNote) {
    return this.apiService.postAPI(
      conversations,
      '/task/internal-note',
      payload
    );
  }

  sendEditInternalNote(payload: IPayloadEditNote) {
    return this.apiService.postAPI(
      conversations,
      '/task/edit-internal-note',
      payload
    );
  }

  syncDocumentInternalNote(payload: ISyncDocumentPayload) {
    return this.apiService.postAPI(
      conversations,
      '/task/sync-property-document-of-internal-note',
      payload
    );
  }
  getListFileInternalNote(taskId: string) {
    return this.apiService.getAPI(
      conversations,
      `task/get-internal-file/${taskId}`
    );
  }
  getThumbnailDocument(internalFileId: string[]) {
    return this.apiService.postAPI(
      conversations,
      `task/generator-preview-of-attachment-internal-note`,
      {
        internalFileId
      }
    );
  }
}
