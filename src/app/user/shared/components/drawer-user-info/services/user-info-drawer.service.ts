import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  ICallRequest,
  IExportConversation,
  ISendMsg,
  IUpgradePlan
} from '@/app/user/shared/interfaces/user-info-drawer.interfaces';
import {
  callRequestConfigs,
  sendMsgConfigs,
  upgradePlanConfigs
} from '@/app/user/shared/components/drawer-user-info/constants/constants';
import { UserProperty } from '@/app/shared';

@Injectable({
  providedIn: 'root'
})
export class UserInfoDrawerService {
  private exportConversationBS: BehaviorSubject<IExportConversation> =
    new BehaviorSubject({
      state: false,
      userPropertyId: ''
    });
  private sendMsgBS: BehaviorSubject<ISendMsg> = new BehaviorSubject(
    sendMsgConfigs
  );
  private callRequestBS: BehaviorSubject<ICallRequest> = new BehaviorSubject(
    callRequestConfigs
  );
  private upgradePlanBS: BehaviorSubject<IUpgradePlan> = new BehaviorSubject(
    upgradePlanConfigs
  );
  private deletedUserBS: BehaviorSubject<string> = new BehaviorSubject<string>(
    null
  );
  public exportConversation$ = this.exportConversationBS.asObservable();
  public sendMsg$ = this.sendMsgBS.asObservable();
  public callRequest$ = this.callRequestBS.asObservable();
  public upgradePlan$ = this.upgradePlanBS.asObservable();
  public deletedUser$ = this.deletedUserBS.asObservable();
  private deletedUserForSms: BehaviorSubject<UserProperty> =
    new BehaviorSubject<UserProperty>(null);
  public deletedUserForSms$ = this.deletedUserForSms.asObservable();

  setDeletedUserForSMS(value: UserProperty) {
    this.deletedUserForSms.next(value);
  }

  setDeletedUser(userId: string) {
    this.deletedUserBS.next(userId);
  }

  openExportConversation(value: IExportConversation) {
    this.exportConversationBS.next({
      ...this.exportConversationBS.getValue(),
      ...value
    });
  }

  openSendMsg(value: ISendMsg) {
    this.sendMsgBS.next({ ...this.sendMsgBS.getValue(), ...value });
  }

  openCallRequest(value: ICallRequest) {
    this.callRequestBS.next({ ...this.callRequestBS.getValue(), ...value });
  }

  openUpgradePlan(value: IUpgradePlan) {
    this.upgradePlanBS.next({ ...this.upgradePlanBS.getValue(), ...value });
  }

  closeMultiModal() {
    this.openSendMsg({
      state: false
    });

    this.openCallRequest({
      state: false
    });

    this.openExportConversation({
      state: false
    });

    this.openUpgradePlan({
      state: false,
      stateRequestSend: false
    });
  }
}
