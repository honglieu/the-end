import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, filter } from 'rxjs';
import {
  EmailItem,
  IEmailMoveToAction,
  IMailFolderQueryParams,
  IMoveMailFolder
} from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';

@Injectable({
  providedIn: 'root'
})
export class EmailViewService {
  private emailItemLists: BehaviorSubject<EmailItem[]> = new BehaviorSubject<
    EmailItem[]
  >(null);
  private emailMoveToAction: BehaviorSubject<IEmailMoveToAction> =
    new BehaviorSubject(null);
  private isLoadingEmailList: BehaviorSubject<boolean> = new BehaviorSubject(
    true
  );
  private preQuerryParamsMoveMessage: BehaviorSubject<{}> = new BehaviorSubject(
    {}
  );
  public handleConfirmMoveMailToInbox = new Subject<{
    data: IMoveMailFolder[];
    payload: IMailFolderQueryParams;
  }>();

  get preQuerryParamsMoveMessage$() {
    return this.preQuerryParamsMoveMessage.asObservable();
  }

  private resetEmailDetail = new Subject<void>();

  constructor() {}

  get resetEmailDetail$() {
    return this.resetEmailDetail.asObservable();
  }

  get emailItemLists$() {
    return this.emailItemLists.asObservable().pipe(filter((item) => !!item));
  }

  get emailItemListsValue() {
    return this.emailItemLists.getValue();
  }

  get emailMoveToAction$() {
    return this.emailMoveToAction.asObservable().pipe(filter((item) => !!item));
  }

  get isLoadingEmailList$() {
    return this.isLoadingEmailList.asObservable();
  }

  triggerResetEmailDetail() {
    this.resetEmailDetail.next();
  }

  setEmailItemLists(value: EmailItem[]) {
    this.emailItemLists.next(value);
  }

  setEmailMoveToAction(value: IEmailMoveToAction) {
    this.emailMoveToAction.next(value);
  }

  setIsLoadingEmailList(value: boolean) {
    this.isLoadingEmailList.next(value);
  }

  setPreQuerryParamsMoveMessage(value) {
    this.preQuerryParamsMoveMessage.next(value);
  }
}
