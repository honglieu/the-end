import { Injectable } from '@angular/core';
import { conversations } from 'src/environments/environment';
import { ApiService } from './api.service';
import { EUserPropertyType } from '@shared/enum/user.enum';

@Injectable({
  providedIn: 'root'
})
export class CallingService {
  constructor(private apiService: ApiService) {}

  getCallTime(messageCall: any) {
    if (!messageCall) {
      return '';
    }
    const endedAt = messageCall.endedAt;
    const endTime = (endedAt ? new Date(endedAt) : new Date()).getTime();
    const startTime = new Date(messageCall.createdAt).getTime();
    const secondDiff = (endTime - startTime) % 60000;
    const minutesDiff = (endTime - startTime - secondDiff) % 3600000;
    const hoursDiff = endTime - startTime - minutesDiff - secondDiff;
    let res = '';
    if (hoursDiff) {
      res += `${Math.trunc(hoursDiff / 3600000)}:`;
    }
    res += `${this.pad(Math.trunc(minutesDiff / 60000), 2)}:${this.pad(
      Math.trunc(secondDiff / 1000),
      2
    )}`;

    messageCall.callTime = res;
    return res;
  }

  pad(num: any, size: number) {
    let s = num + '';
    while (s.length < size) {
      s = '0' + s;
    }
    return s;
  }

  startVoiceCall(
    conversationId: string,
    callLink: string,
    userId: string,
    propertyId: string
  ) {
    const body = {
      conversationId,
      userId,
      propertyId,
      callLink
    };
    return this.apiService.postAPI(conversations, 'start-voice-call', body);
  }

  endVoiceCall(callSid: string, messageCallId: string) {
    const body = {
      callSid,
      messageCallId
    };
    return this.apiService.postAPI(conversations, 'end-voice-call', body);
  }

  recordVoiceCall(body: {
    callSid: string;
    isRecord: boolean;
    userId: string;
    tenantId: string;
    propertyId: string;
    clientTimeZone: string;
    time: number;
  }) {
    return this.apiService.postAPI(conversations, 'record-voice-call', body);
  }

  joinVoiceCall(body: {
    messageCallId: string;
    userId: string;
    propertyId: string;
  }) {
    return this.apiService.postAPI(conversations, 'join-call', body);
  }

  getReceiverType(receiverType: EUserPropertyType) {
    switch (receiverType) {
      case EUserPropertyType.LANDLORD:
      case EUserPropertyType.OWNER:
      case EUserPropertyType.OWNER_PROSPECT:
      case EUserPropertyType.LANDLORD_PROSPECT:
      case EUserPropertyType.OWNERSHIP:
        return 'landlord';
      case EUserPropertyType.TENANT:
      case EUserPropertyType.TENANT_UNIT:
      case EUserPropertyType.TENANT_PROPERTY:
      case EUserPropertyType.TENANT_PROSPECT:
      case EUserPropertyType.TENANT_RM:
      case EUserPropertyType.TENANCY:
        return 'tenant';
      case EUserPropertyType.SUPPLIER:
        return 'supplier';
      default:
        return '';
    }
  }
}
