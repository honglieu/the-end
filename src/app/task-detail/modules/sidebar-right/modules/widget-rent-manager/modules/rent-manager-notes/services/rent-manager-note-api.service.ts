import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import {
  IInputToGetListExistingNote,
  IRentManagerNote
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/interfaces/rent-manager-notes.interface';

@Injectable({
  providedIn: 'root'
})
export class RentManagerNoteApiService {
  constructor(private apiService: ApiService) {}
  getListNoteExisting(body: IInputToGetListExistingNote) {
    return this.apiService.postAPI(
      conversations,
      'widget/history-notes/get-existing',
      body
    );
  }
  syncNoteToRM(body: IRentManagerNote) {
    return this.apiService.postAPI(
      conversations,
      'widget/history-notes/sync',
      body
    );
  }
  removeRmNote(rmNoteId: string) {
    return this.apiService.getAPI(
      conversations,
      `widget/history-notes/${rmNoteId}/cancel`
    );
  }

  retryRmNote(rmNoteId: string) {
    return this.apiService.getAPI(
      conversations,
      `widget/service-note/${rmNoteId}/retry`
    );
  }
}
