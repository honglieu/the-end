import { ApiService } from '@/app/services/api.service';
import {
  ICommentQueryParam,
  ICommentRequest
} from '@/app/task-detail/modules/steps/utils/comment.interface';
import { conversations } from '@/environments/environment';
import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class CommentsApiService {
  constructor(private apiService: ApiService) {}

  getComments(queryParams: ICommentQueryParam) {
    const { taskId, stepId, friendlyId, limit = 20, type } = queryParams;
    const baseUrl = `task/v2/internal-notes/${taskId}`;

    const params = new URLSearchParams({
      limit: limit.toString(),
      stepId
    });

    if (friendlyId) params.append('friendlyId', friendlyId);
    if (type) params.append('type', type);

    const queryString = `${baseUrl}?${params.toString()}`;
    return this.apiService.getAPI(conversations, queryString);
  }

  createComment(payload: ICommentRequest) {
    return this.apiService.postAPI(
      conversations,
      'task/internal-note',
      payload
    );
  }

  updateComment(payload: ICommentRequest) {
    return this.apiService.postAPI(
      conversations,
      'task/edit-internal-note',
      payload
    );
  }

  deleteComment(noteId: string) {
    return this.apiService.deleteAPI(
      conversations,
      `task/delete-internal-note/${noteId}`
    );
  }

  getListFileInternalNote(taskId, stepId) {
    return this.apiService.getAPI(
      conversations,
      `task/get-internal-file/${taskId}/${stepId}`
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
