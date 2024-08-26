import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConversationService } from '@services/conversation.service';
import { NoteType } from '@/app/breach-notice/utils/breach-notice.type';
import { Personal } from '@shared/types/user.interface';
import { BreachNoticeTrudiResponse } from '@shared/types/trudi.interface';
import { TrudiService } from '@services/trudi.service';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { EEventStatus } from '@shared/enum/calendar.enum';
@Injectable({
  providedIn: 'root'
})
export class BreachNoticeService {
  public isExpandPopupPT$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public triggerNoteRefresh$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public trudiConversationId: BehaviorSubject<string> = new BehaviorSubject('');
  public taskId: string = '';
  public isEditBreachOfContract$: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public isShowTenancy$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  public listNoteType$: BehaviorSubject<Array<NoteType>> = new BehaviorSubject(
    []
  );
  public listTenancy$: BehaviorSubject<Array<Personal>> = new BehaviorSubject(
    []
  );
  public isCreateArrear$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private conversationService: ConversationService,
    private trudiService: TrudiService<BreachNoticeTrudiResponse>,
    private eventCalendarService: EventCalendarService
  ) {}

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

  updateResponseData(action: string, data: BreachNoticeTrudiResponse) {
    if (!action) throw new Error('there must be action');
    this.trudiService.updateTrudiResponse = data;
  }
  checkIsActiveOrOpenBreachOfContract(): boolean {
    return !(
      this.breachRemedyEvent?.eventStatus !== EEventStatus.OPENED ||
      !this.breachRemedyEventId
    );
  }
  get breachRemedyEventId() {
    return this.trudiService.getTrudiResponse?.value?.variable
      ?.breachRemedyEventId;
  }
  get breachRemedyEvent() {
    return this.eventCalendarService.listEvents?.find(
      (eventItem) => eventItem.id === this.breachRemedyEventId
    );
  }
}
