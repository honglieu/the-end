import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { ConversationService } from './conversation.service';
import { conversations } from 'src/environments/environment';
import { IngoingInspectionResponseInterface } from '@shared/types/ingoing-inspection.interface';

@Injectable({
  providedIn: 'root'
})
export class IngoingInspectionService {
  public ingoingInspectionResponse =
    new BehaviorSubject<IngoingInspectionResponseInterface>(null);
  public trudiConversationId: BehaviorSubject<string> = new BehaviorSubject('');
  public showIngoingInspectionSync: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public inspectionStatus: BehaviorSubject<string> = new BehaviorSubject('');
  constructor(
    private apiService: ApiService,
    private conversationService: ConversationService
  ) {
    this.handleGetTrudiConversationId();
  }

  handleGetTrudiConversationId() {
    const currentConversationList =
      this.conversationService.listConversationByTask.getValue();
    if (currentConversationList && currentConversationList.length) {
      const trudiConversation = currentConversationList.find(
        (item) => item.trudiResponse
      );
      this.trudiConversationId.next(trudiConversation?.id);
    }
  }

  updateResponseData(action: string, data: IngoingInspectionResponseInterface) {
    if (!action) throw new Error('there must be action');
    this.ingoingInspectionResponse.next(data);
  }

  syncReschedule(
    inspectionId: string,
    body: {
      taskId: string;
      propertyId: string;
      inspectionStartTimestamp: string;
      inspectionEndTimestamp: string;
    }
  ) {
    return this.apiService.putAPI(
      conversations,
      `leasing/sync-reschedule-inspection-to-property-tree/${inspectionId}`,
      body
    );
  }

  syncNewInspection(body: {
    taskId: string;
    propertyId: string;
    inspectionStartTimestamp: string;
    inspectionEndTimestamp: string;
    tenancyId: string;
  }) {
    return this.apiService.postAPI(
      conversations,
      `leasing/sync-inspection-to-property-tree`,
      body
    );
  }

  markInspectionNotesAsRead(taskId: string) {
    return this.apiService.postAPI(
      conversations,
      'leasing/update-status-general-notes',
      {
        taskId
      }
    );
  }
}
