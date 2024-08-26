import { LandlordTenantButtonAction } from './../shared/enum/landlordTenant.enum';
import { TrudiReceivers, TrudiResponse } from '@shared/types/trudi.interface';
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import { ITaskDetail } from '@shared/types/task.interface';
import { UserItemInMessagePopup } from '@shared/types/user.interface';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { SendBulkMessageResponse } from '@shared/types/conversation.interface';
import { SharedService } from './shared.service';
import { TypeWithTForConversationMap } from '@shared/types/share.model';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';

@Injectable({
  providedIn: 'root'
})
export class TenantLandlordRequestService {
  public tenantLandlordRequestResponse: BehaviorSubject<TrudiResponse> =
    new BehaviorSubject(null);
  public tenantLandlordFloatingDisplayStatus$: BehaviorSubject<boolean> =
    new BehaviorSubject(false);

  constructor(
    private apiService: ApiService,
    private sharedService: SharedService
  ) {}

  chooseTenantLandlordDecision(taskId: string, decisionIndex: number) {
    return this.apiService.postAPI(
      conversations,
      'request-landlord-tenant/confirm-decision',
      {
        taskId,
        decisionIndex
      }
    );
  }

  confirmTenantLandlordRequestDecision(taskId: string, decisionIndex: number) {
    return this.apiService.postAPI(
      conversations,
      'request-landlord-tenant/confirm-decision',
      {
        taskId,
        decisionIndex
      }
    );
  }

  changeButtonStatus(
    taskId: string,
    action: LandlordTenantButtonAction,
    status: TrudiButtonEnumStatus
  ) {
    return this.apiService.postAPI(
      conversations,
      'request-landlord-tenant/update-status-button',
      {
        taskId,
        action,
        status
      }
    );
  }

  updateTenantLandlordResponseData(action: string, data: any) {
    if (!action) throw new Error('there must be action');
    this.tenantLandlordRequestResponse.next(data);
  }

  saveVariableResponseData(
    taskId: string,
    receivers: any[],
    taskDetail?: ITaskDetail
  ) {
    return this.apiService.postAPI(
      conversations,
      'request-landlord-tenant/save-variable',
      {
        taskId,
        receivers,
        taskDetail
      }
    );
  }

  mapUserItemInMessagePopupToReceiver(
    list: UserItemInMessagePopup[]
  ): TrudiReceivers[] {
    return list.map((el) => {
      return {
        id: el.id,
        firstName: el.firstName,
        lastName: el.lastName,
        userPropertyType: el.type as EUserPropertyType,
        lastActivity: el.lastActivity,
        email: el.email,
        isPrimary: el.isPrimary,
        inviteSent: el.inviteSent,
        offBoarded: el.offBoarded
      } as TrudiReceivers;
    });
  }

  mapConversationToUser(
    receivers: TypeWithTForConversationMap<
      TrudiReceivers,
      LandlordTenantButtonAction
    >[],
    newUsers: TypeWithTForConversationMap<
      TrudiReceivers,
      LandlordTenantButtonAction
    >[],
    res: SendBulkMessageResponse[],
    action: LandlordTenantButtonAction
  ) {
    return this.sharedService.mapConversationToUser<
      TrudiReceivers,
      LandlordTenantButtonAction
    >(receivers, newUsers, res, action);
  }

  mapRequestConversationToUser(
    receivers: TrudiReceivers[],
    newUsers: TrudiReceivers[],
    res: SendBulkMessageResponse[],
    action: LandlordTenantButtonAction
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

  syncNoteToProperty(
    description: string,
    propertyId: string,
    categoryId: string,
    taskId: string,
    ptNoteEntityType: string,
    decisionIndex: number
  ) {
    return this.apiService.postAPI(
      conversations,
      'request-landlord-tenant/sync-to-pt',
      {
        propertyId,
        categoryId,
        ptNoteEntityType,
        taskId,
        description,
        decisionIndex
      }
    );
  }
}
