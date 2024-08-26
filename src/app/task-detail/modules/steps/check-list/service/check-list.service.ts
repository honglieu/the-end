import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { IFile } from '@shared/types/file.interface';
import { conversations } from 'src/environments/environment';

export interface IBaseCheckListNote {
  text: string;
  files: IFile[];
  cards?: ISelectedReceivers[];
  stepId: string;
  taskId: string;
  noteId: string;
}

export interface IGetCheckListNotePayload {
  stepId: string;
  taskId: string;
}

export interface IUpdateCheckListNotePayload extends IBaseCheckListNote {}
export interface ICheckListNoteResponse extends IBaseCheckListNote {}

@Injectable({
  providedIn: 'root'
})
export class CheckListService {
  constructor(private apiService: ApiService) {}

  getStepCheckListNote(payload: IGetCheckListNotePayload) {
    return this.apiService.postAPI(
      conversations,
      'task-management/get-step-check-list-note',
      payload
    );
  }

  updateCheckListNote(payload: IUpdateCheckListNotePayload) {
    return this.apiService.postAPI(
      conversations,
      'task-management/update-step-check-list-note',
      payload
    );
  }
}
