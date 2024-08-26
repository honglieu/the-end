import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { conversations } from 'src/environments/environment';
import { RoutineInspectionButtonAction } from '@shared/enum/routine-inspection.enum';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { SendBulkMessageResponse } from '@shared/types/conversation.interface';
import { IMessage } from '@shared/types/message.interface';
import { ReiFormData } from '@shared/types/rei-form.interface';
import {
  InspectionSyncData,
  RoutineInspectionNotes,
  RoutineInspectionRequestTrudiVariableReceiver,
  RoutineInspectionRescheduled,
  RoutineInspectionResponseInterface,
  RoutineInspectionSync
} from '@shared/types/routine-inspection.interface';
import { UserItemInMessagePopup } from '@shared/types/user.interface';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { ApiService } from './api.service';
import { ConversationService } from './conversation.service';
import { TaskService } from './task.service';

@Injectable({
  providedIn: 'root'
})
export class RoutineInspectionService {
  public routineInspectionResponse =
    new BehaviorSubject<RoutineInspectionResponseInterface>(null);
  public taskId: string = '';
  public trudiConversationId: BehaviorSubject<string> = new BehaviorSubject('');
  public showRoutineInspectionSync: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public inspectionStatus: BehaviorSubject<string> = new BehaviorSubject('');
  public showRescheduleMessage: BehaviorSubject<
    IMessage & { inspectionData?: InspectionSyncData }
  > = new BehaviorSubject(null);
  private triggerSyncRoutineInSpectionSource = new BehaviorSubject(null);
  public triggerSyncRoutineInSpection$ =
    this.triggerSyncRoutineInSpectionSource.asObservable();

  constructor(
    private apiService: ApiService,
    private conversationService: ConversationService,
    private activatedRoute: ActivatedRoute,
    private taskService: TaskService
  ) {
    this.handleGetTrudiConversationId();
  }

  triggerSyncRoutineInSpection(status: ESyncStatus) {
    this.triggerSyncRoutineInSpectionSource.next(status);
  }

  setSendMsgTitle(sendMsgConfigs) {
    return {
      ...sendMsgConfigs,
      'body.prefillTitle':
        'Routine Inspection - ' + this.taskService.getShortPropertyAddress()
    };
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

  chooseDecision(
    taskId: string,
    status: string
  ): Observable<RoutineInspectionResponseInterface> {
    return this.apiService.postAPI(conversations, 'change-routine-inspection', {
      taskId,
      status
    });
  }

  checkTaskHasConversationWithTypeAndAction(
    receivers: RoutineInspectionRequestTrudiVariableReceiver[],
    type: EUserPropertyType,
    action: RoutineInspectionButtonAction,
    isReset?: boolean
  ) {
    return receivers.some(
      (receiver) =>
        receiver.userPropertyType === type &&
        (receiver.raiseBy === 'USER' ||
          ((receiver.action !== action || isReset) &&
            receiver.raiseBy === 'AGENT'))
    );
  }

  checkConversationIdWithTypeAndAction(
    receivers: RoutineInspectionRequestTrudiVariableReceiver[],
    type: EUserPropertyType,
    action: RoutineInspectionButtonAction,
    isReset?: boolean
  ) {
    return receivers.some(
      (receiver) =>
        receiver.userPropertyType === type &&
        !receiver?.conversationId &&
        (receiver.raiseBy === 'USER' ||
          ((receiver.action !== action || isReset) &&
            receiver.raiseBy === 'AGENT'))
    );
  }

  updateResponseData(action: string, data: any) {
    if (!action) throw new Error('there must be action');
    this.routineInspectionResponse.next(data);
  }

  updateButtonStatus(action: string, status: TrudiButtonEnumStatus) {
    return this.apiService.postAPI(
      conversations,
      'routine-inspection/update-status-button',
      { taskId: this.taskService.currentTask$.value.id, action, status }
    );
  }

  saveRoutineInspectionVariable(bodySaveVariable: {
    receivers?: RoutineInspectionRequestTrudiVariableReceiver[];
    reiFormInfor?: {
      action: string;
      formData: ReiFormData | {};
    };
    region: {
      id: string;
      name: string;
    };
    startTime: string;
    endTime: string;
  }) {
    const { receivers, reiFormInfor } = bodySaveVariable;

    return this.apiService.postAPI(
      conversations,
      'routine-inspection/save-variable',
      {
        taskId: this.taskService.currentTask$.value.id,
        receivers,
        reiFormInfor
      }
    );
  }

  mapUserItemInMessagePopupToReceiver(
    list: UserItemInMessagePopup[]
  ): RoutineInspectionRequestTrudiVariableReceiver[] {
    return list.map((el) => {
      return {
        id: el.id,
        firstName: el.firstName,
        lastName: el.lastName,
        userPropertyType: el.type as EUserPropertyType,
        lastActivity: el.lastActivity,
        email: el?.email,
        iviteSent: el?.inviteSent,
        offBoardedDate: el?.offBoarded,
        isPrimary: el?.isPrimary
      } as RoutineInspectionRequestTrudiVariableReceiver;
    });
  }

  scheduleSendMessage(body) {
    return this.apiService.postAPI(
      conversations,
      'routine-inspection/schedule-send-message',
      body
    );
  }

  mapConversationToUser(
    receivers: RoutineInspectionRequestTrudiVariableReceiver[],
    newUsers: RoutineInspectionRequestTrudiVariableReceiver[],
    res: SendBulkMessageResponse[],
    action: RoutineInspectionButtonAction
  ) {
    const oldReceivers = receivers.map((receiver) => ({
      ...receiver,
      conversationId:
        receiver.raiseBy !== 'USER' && !receiver.conversationId
          ? this.findConversationIdByPersonUserId(receiver.id, res)
          : receiver.conversationId
    }));
    const oldReceiverIds = oldReceivers.map((e) => e.id);
    const newReceiver = newUsers
      .filter((user) => !oldReceiverIds.includes(user.id))
      .map((el) => ({
        ...el,
        conversationId: this.findConversationIdByPersonUserId(el.id, res),
        action: action,
        raiseBy: EUserPropertyType.AGENT
      }));

    return [...oldReceivers, ...newReceiver];
  }

  findConversationIdByPersonUserId(
    personUserId: string,
    sendBulkResponse: SendBulkMessageResponse[]
  ) {
    return sendBulkResponse.find((el) => el.personUserId === personUserId)
      ?.conversationId;
  }

  countUserInList(
    list: RoutineInspectionRequestTrudiVariableReceiver[],
    type: EUserPropertyType
  ) {
    return list.filter((item) => item.userPropertyType === type).length;
  }

  mapToRoutineInspectionSync(
    notes?: RoutineInspectionNotes,
    rescheduled?: RoutineInspectionRescheduled,
    syncDate?,
    syncStatus?
  ) {
    let routineInpsectionSync =
      this.routineInspectionResponse.getValue().routineInspectionSync;
    if (routineInpsectionSync) {
      if (routineInpsectionSync.notes)
        routineInpsectionSync.notes = notes
          ? { ...routineInpsectionSync.notes, ...notes }
          : routineInpsectionSync.notes;
      if (routineInpsectionSync.rescheduled)
        routineInpsectionSync.rescheduled = rescheduled
          ? { ...routineInpsectionSync.rescheduled, ...rescheduled }
          : routineInpsectionSync.rescheduled;
      return routineInpsectionSync;
    } else {
      const data = {
        notes: {
          generalNotes: '',
          ownerFollowupItems: '',
          ownerNotes: '',
          tenantActions: '',
          tenantNotes: ''
        },
        rescheduled: {
          endTime: '',
          isRescheduled: false,
          startTime: ''
        },
        syncDates: '',
        syncStatus: ''
      } as RoutineInspectionSync;
      if (notes) data.notes = { ...data.notes, ...notes };
      if (rescheduled)
        data.rescheduled = { ...data.rescheduled, ...rescheduled };
      return data;
    }
  }

  syncReschedule(body: {
    agencyId: string;
    taskId: string;
    startTime: string;
    endTime: string;
  }) {
    return this.apiService.postAPI(
      conversations,
      'routine-inspection/reschedule',
      body
    );
  }

  getListInspections(body: { propertyId: string }) {
    return this.apiService.getAPI(
      conversations,
      'routine-inspection/get-inspections',
      body
    );
  }

  markInpsectionNotesAsRead(taskId: string) {
    return this.apiService.postAPI(
      conversations,
      'routine-inspection/update-status-general-notes',
      {
        taskId
      }
    );
  }

  changeStatusRecheduled(body: { messageId: string; status: string }) {
    return this.apiService.postAPI(
      conversations,
      'inspection/change_status_reschedule_request',
      body
    );
  }
}
