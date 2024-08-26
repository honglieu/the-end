import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { sendMessageData } from '@shared/types/message.interface';
export interface PopupState {
  display: boolean;
  resetField: boolean;
  fileTabNotReset?: boolean;
}
export interface DeleteTaskPopup {
  display: boolean;
  isFromCompletedSection?: boolean;
  isFromTrudiTab?: boolean;
}

export interface DefaultQuitPopup {
  sureText: string;
  cannotText: string;
  leftBtnText: string;
  rightBtnText: string;
}
@Injectable({
  providedIn: 'root'
})
export class PopupService {
  public fromFileModal: BehaviorSubject<boolean> = new BehaviorSubject(null);
  public fromActionLinkModal: BehaviorSubject<boolean> = new BehaviorSubject(
    null
  );
  public fromMessageModal: BehaviorSubject<boolean> = new BehaviorSubject(null);
  public fromMaintenance: BehaviorSubject<boolean> = new BehaviorSubject(null);
  public fromDeleteTask: BehaviorSubject<DeleteTaskPopup> = new BehaviorSubject(
    null
  );
  public fromDeleteEmail: BehaviorSubject<string> = new BehaviorSubject(null);
  public fromDeletePhone: BehaviorSubject<string> = new BehaviorSubject(null);
  public defaultQuitPopup: BehaviorSubject<DefaultQuitPopup> =
    new BehaviorSubject(null);
  public isScrollModal: BehaviorSubject<any> = new BehaviorSubject(null);
  public quitPopupConfirmed: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public isResetFile$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public sendMessageData: BehaviorSubject<sendMessageData> =
    new BehaviorSubject(null);

  public isShowQuitConfirmModal: BehaviorSubject<any> = new BehaviorSubject(
    null
  );
  public isShowSelectPeopleModal: BehaviorSubject<any> = new BehaviorSubject(
    null
  );
  public isShowSecceessMessageModal: BehaviorSubject<any> = new BehaviorSubject(
    null
  );
  public isShowActionLinkModal: BehaviorSubject<any> = new BehaviorSubject(
    null
  );
  public isShowNewActionLinkModal: BehaviorSubject<PopupState> =
    new BehaviorSubject(null);
  public isShowAddFilesModal: BehaviorSubject<any> = new BehaviorSubject(null);
  public isShowAddFileArea: BehaviorSubject<PopupState> = new BehaviorSubject(
    null
  );
  public isShowNewMessageFromIndex: BehaviorSubject<boolean> =
    new BehaviorSubject(false);

  selectPeople$ = new BehaviorSubject<boolean>(false);
  includePeople$ = new BehaviorSubject(true);
  constructor() {}

  setIsScroll(status: boolean) {
    this.isScrollModal.next(status);
  }

  setFromMessageModal(status: boolean) {
    this.fromMessageModal.next(status);
  }

  setFromFileModal(status: boolean) {
    this.fromFileModal.next(status);
  }

  setFromActionLinkModal(status: boolean) {
    this.fromActionLinkModal.next(status);
  }

  setQuitPopupConfirmed(status: boolean) {
    this.quitPopupConfirmed.next(status);
  }

  setQuitSendMain(status: boolean) {
    this.fromMaintenance.next(status);
  }

  getIsScroll() {
    return this.isScrollModal.asObservable();
  }

  getFromMessageModal() {
    return this.fromMessageModal.asObservable();
  }

  getFromFileModal() {
    return this.fromFileModal.asObservable();
  }

  getFromActionLinkModal() {
    return this.fromActionLinkModal.asObservable();
  }

  getFromQuitMaintenance() {
    return this.fromMaintenance.asObservable();
  }
  getQuitPopupConfirmed() {
    return this.quitPopupConfirmed.asObservable();
  }
}
