import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, filter } from 'rxjs';
import {
  ICategoryTaskActivity,
  IMailboxSetting,
  ISaveMailboxTaskActivity,
  TeamPermission
} from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import { EUserMailboxRole } from '@/app/mailbox-setting/utils/enum';
import { IMailBox } from '@shared/types/user.interface';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Injectable({
  providedIn: 'root'
})
export class MailboxSettingService {
  private currentAgencyId: BehaviorSubject<string> = new BehaviorSubject('');
  private teamPermissonData: BehaviorSubject<TeamPermission> =
    new BehaviorSubject([]);
  private mailboxId: BehaviorSubject<string> = new BehaviorSubject('');
  private mailboxSetting: BehaviorSubject<IMailboxSetting> =
    new BehaviorSubject(null);
  private role: BehaviorSubject<Array<keyof typeof EUserMailboxRole>> =
    new BehaviorSubject(null);
  private isLoadingSetting: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  private teamMembersInMailBox: BehaviorSubject<number> = new BehaviorSubject(
    0
  );
  private isOpenPopupMerge$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  private isOpenPopupEnquiry$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public senderMailBoxId = new Subject<string>();
  public senderMaiBoxSignature: BehaviorSubject<IMailboxSetting> =
    new BehaviorSubject(null);
  public refreshRenderAiRepliesTable: BehaviorSubject<void> =
    new BehaviorSubject<void>(null);
  private AIReplySearchValue: BehaviorSubject<string> = new BehaviorSubject('');
  private questionId: BehaviorSubject<string> = new BehaviorSubject('');
  private saveMailboxSyncTaskActivity: BehaviorSubject<ISaveMailboxTaskActivity> =
    new BehaviorSubject(null);
  private listCategoryTaskActivity: BehaviorSubject<ICategoryTaskActivity[]> =
    new BehaviorSubject(null);

  public triggerOrderListMailBox: Subject<IMailBox[]> = new Subject();

  public orderListMailBox: Map<
    string,
    {
      orderId: string;
      order: number;
    }
  > = new Map();

  get senderMaiBoxSignature$(): Observable<IMailboxSetting> {
    return this.senderMaiBoxSignature
      .asObservable()
      .pipe(filter((setting) => !!setting));
  }

  constructor() {}

  get AIReplySearchValue$() {
    return this.AIReplySearchValue.asObservable();
  }

  get isLoadingSetting$() {
    return this.isLoadingSetting.asObservable();
  }

  get teamMembersInMailBox$(): Observable<number> {
    return this.teamMembersInMailBox.asObservable();
  }

  get role$(): Observable<Array<keyof typeof EUserMailboxRole>> {
    return this.role.asObservable();
  }

  get mailBoxId$(): Observable<string> {
    return this.mailboxId.asObservable();
  }

  get currentAgencyId$(): Observable<string> {
    return this.currentAgencyId.asObservable().pipe(filter((id) => !!id));
  }

  get teamPermissonData$() {
    return this.teamPermissonData.asObservable();
  }

  get teamPermissonValue() {
    return this.teamPermissonData.getValue();
  }

  get mailboxSetting$(): Observable<IMailboxSetting> {
    return this.mailboxSetting
      .asObservable()
      .pipe(filter((setting) => !!setting));
  }

  get mailboxSettingValue() {
    return this.mailboxSetting.getValue();
  }

  setAIReplySearchValue(value: string) {
    return this.AIReplySearchValue.next(value);
  }

  setIsLoadingSetting(value: boolean) {
    this.isLoadingSetting.next(value);
  }

  setRole(value: Array<keyof typeof EUserMailboxRole>) {
    this.role.next(value);
  }

  setMailboxSetting(setting: IMailboxSetting) {
    this.mailboxSetting.next(setting);
    this.senderMaiBoxSignature.next(setting);
  }

  setTeamMembersInMailBox(value: number) {
    if (this.teamMembersInMailBox.getValue() === value) return;
    this.teamMembersInMailBox.next(value);
  }

  setCurrentAgencyId(id: string) {
    return this.nextBehaviorSubject(this.currentAgencyId, id);
  }

  setMailBoxId(id: string) {
    return this.nextBehaviorSubject(this.mailboxId, id);
  }

  nextBehaviorSubject<T>(obs: BehaviorSubject<T>, value: T) {
    if (obs.value === value) return;
    return obs.next(value);
  }

  updateTeamPermissonData(data: TeamPermission) {
    this.teamPermissonData.next([...this.teamPermissonValue, ...data]);
  }

  setTeamPermissonData(data: TeamPermission) {
    this.teamPermissonData.next(data);
  }

  resetTeamPermissonData() {
    this.teamPermissonData.next([]);
  }

  public isOpenPopup() {
    return this.isOpenPopupMerge$.asObservable();
  }

  public setIsOpenPopupMerge(value: boolean) {
    return this.isOpenPopupMerge$.next(value);
  }
  public isOpenPopupEnquiry() {
    return this.isOpenPopupEnquiry$.asObservable();
  }

  public setIsOpenPopupEnquiry(value: boolean) {
    return this.isOpenPopupEnquiry$.next(value);
  }
  public setQuestionId(value: string) {
    return this.questionId.next(value);
  }

  public getQuestionId() {
    return this.questionId.asObservable();
  }

  getSaveMailboxSyncTaskActivity() {
    return this.saveMailboxSyncTaskActivity.asObservable();
  }

  setSaveMailboxSyncTaskActivity(
    mailboxActivitySetting: ISaveMailboxTaskActivity
  ) {
    return this.saveMailboxSyncTaskActivity.next(mailboxActivitySetting);
  }

  getListCategoryTaskActivity() {
    return this.listCategoryTaskActivity.asObservable();
  }

  setListCategoryTaskActivity(data: ICategoryTaskActivity[]) {
    return this.listCategoryTaskActivity.next(data);
  }

  handleDropMailBoxItem(
    event: CdkDragDrop<string[]>,
    listMailBoxs: IMailBox[]
  ) {
    moveItemInArray(listMailBoxs, event.previousIndex, event.currentIndex);
    const reoderList = listMailBoxs.map((item, index) => {
      return {
        ...item,
        order: index + 1
      };
    });
    this.triggerOrderListMailBox.next(reoderList);
  }

  setOrderListMailBox(mailboxes: IMailBox[]) {
    mailboxes.forEach((item) => {
      const foundOrder = this.orderListMailBox.get(item.id);
      if (foundOrder) {
        item.orderId = foundOrder.orderId;
        item.order = foundOrder.order;
      }
    });
  }
}
