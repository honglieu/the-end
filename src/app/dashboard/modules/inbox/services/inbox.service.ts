import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { EUserMailboxRole } from '@/app/mailbox-setting/utils/enum';
import { EMailBoxPopUp, EMailBoxStatus } from '@shared/enum/inbox.enum';
import {
  IListConversationConfirmProperties,
  PreviewConversation
} from '@shared/types/conversation.interface';
import { IMailBox, SpamFolder } from '@shared/types/user.interface';
import { EPopupMoveMessToTaskState } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import {
  MovableMessages,
  MoveMessagesResponse
} from '@shared/types/conversation.interface';
import { IListTaskTemplate } from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { TaskItem } from '@shared/types/task.interface';
import { EmailItem } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { TaskStatusType } from '@shared/enum';

export interface IReadSingleMessage {
  isReadMessage?: boolean;
  previousMessageId?: string;
  currentMessageId?: string;
  isMarkUnRead?: boolean;
}

export interface ITotalCount {
  totalItem: number;
  mailBoxId: string;
}

@Injectable({
  providedIn: 'root'
})
export class InboxService {
  private popupMailBox$: BehaviorSubject<EMailBoxPopUp> =
    new BehaviorSubject<EMailBoxPopUp>(null);
  private mailBoxId$: BehaviorSubject<string> = new BehaviorSubject<string>(
    null
  );
  private mailBoxIdEmailFolder$: BehaviorSubject<string> =
    new BehaviorSubject<string>(null);
  private mailBoxRole$: BehaviorSubject<Array<keyof typeof EUserMailboxRole>> =
    new BehaviorSubject<Array<keyof typeof EUserMailboxRole>>(null);
  private currentMailBox: BehaviorSubject<IMailBox> =
    new BehaviorSubject<IMailBox>(null);
  private currentMailBoxEmailFolder: BehaviorSubject<IMailBox> =
    new BehaviorSubject<IMailBox>(null);
  private refreshEmailFolderMailBox: BehaviorSubject<IMailBox> =
    new BehaviorSubject<IMailBox>(null);
  public triggerUpdateFolderClientMailBoxId: BehaviorSubject<string> =
    new BehaviorSubject(null);
  private isLoadingMailBox: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  private isSkeletonMessage: BehaviorSubject<boolean> = new BehaviorSubject(
    true
  );
  public isLoadingMailBox$ = this.isLoadingMailBox.asObservable();

  private syncMailBoxStatus: BehaviorSubject<EMailBoxStatus> =
    new BehaviorSubject<EMailBoxStatus>(null);
  public syncMailBoxStatus$ = this.syncMailBoxStatus.asObservable();
  private isArchiveMailbox: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  public showFolders: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  private listMailBoxs: BehaviorSubject<IMailBox[]> = new BehaviorSubject<
    IMailBox[]
  >(null);

  private listNotSharedMailBoxes: BehaviorSubject<IMailBox[]> =
    new BehaviorSubject<IMailBox[]>(null);

  private isDisconnectedMailbox: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public refreshedListMailBoxs$ = new BehaviorSubject<boolean>(false);
  private spamFolderImap$: BehaviorSubject<SpamFolder> =
    new BehaviorSubject<SpamFolder>(null);
  private conversationSuccess: BehaviorSubject<
    IListConversationConfirmProperties[]
  > = new BehaviorSubject<IListConversationConfirmProperties[]>([]);

  private popupMoveToTask$: BehaviorSubject<EPopupMoveMessToTaskState> =
    new BehaviorSubject<EPopupMoveMessToTaskState>(null);
  public moveMessages$: BehaviorSubject<MovableMessages> =
    new BehaviorSubject<MovableMessages>(null);
  public movedMessages$: BehaviorSubject<
    MoveMessagesResponse[] | EmailItem[] | TaskItem[] | PreviewConversation[]
  > = new BehaviorSubject<
    MoveMessagesResponse[] | EmailItem[] | TaskItem[] | PreviewConversation[]
  >(null);

  // Trigger event reload list email folders (rerender all folder item)
  public triggerEventUpdateFolders: Subject<string> = new Subject();

  public triggerEventUpdateFoldersMsgCount: Subject<boolean> = new Subject();
  public triggerEventUpdateFoldersMsgCountByMailBoxId: Subject<string> =
    new Subject();

  public isBackToModalConvertToTask: BehaviorSubject<boolean> =
    new BehaviorSubject(false);

  private taskTemplate: BehaviorSubject<IListTaskTemplate> =
    new BehaviorSubject(null);

  public currentSelectedTaskTemplate$ = new BehaviorSubject(null);
  public isOpenMoreInboxSidebar$ = new Subject<void>();
  public isOpenEmailFolderByBtnViewToast$ = new Subject<string>();
  public importEmailId$: BehaviorSubject<string> = new BehaviorSubject(null);
  public triggerExpandedSummaryConversation$: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public sessionIdLinkedTask$: BehaviorSubject<string> = new BehaviorSubject(
    null
  );
  public requestIdLinkedTask$: BehaviorSubject<string> = new BehaviorSubject(
    null
  );
  private currentMailboxIdToResolveMsg: BehaviorSubject<string> =
    new BehaviorSubject(null);
  private isAllFiltersDisabled = new BehaviorSubject<boolean>(true);

  private changeUnreadData: BehaviorSubject<IReadSingleMessage> =
    new BehaviorSubject(null);
  private mailBoxIntegrateId$: BehaviorSubject<string> =
    new BehaviorSubject<string>(null);

  public onBulkCreateTaskSuccess$ = new Subject<
    IListConversationConfirmProperties[]
  >();

  private moveToFolderId = new Subject<string>();
  public createTaskByMoveToTaskDragDrop = new Subject<{
    folderId: string;
    isDragDrop: boolean;
  }>();
  public moveToFolderId$ = this.moveToFolderId.asObservable();
  public dropMessageToPortalInbox$ = new Subject<{
    status: TaskStatusType;
    listThreadId?: string[];
  }>();
  public triggerGoToItemDetail$ = new Subject<void>();
  public triggerGetActionDetail$ = new Subject<void>();
  public justNavigateToMessageItem: boolean = false;
  private isOpenPopupAddToTaskBySingleMessage$ = new Subject<boolean>();
  public triggerConversationId$ = new Subject<string>();
  public totalItemCount$ = new Subject<ITotalCount>();
  private isRetryMailbox: Subject<IMailBox> = new Subject();
  private isConnectAgainMailbox: Subject<IMailBox> = new Subject();
  public addNewMailbox$ = new Subject<IMailBox>();
  public mailboxIdEmailActive: Set<string> = new Set();
  public preMailBoxId: BehaviorSubject<string> = new BehaviorSubject(null);
  public isLoadingDetail = new Subject<boolean>();
  constructor(private _formBuilder: FormBuilder) {}

  setIsRetryMailbox(value: IMailBox) {
    this.isRetryMailbox.next(value);
  }

  getIsRetryMailbox() {
    return this.isRetryMailbox.asObservable();
  }

  setIsConnectAgainMailbox(value: IMailBox) {
    this.isConnectAgainMailbox.next(value);
  }

  getIsConnectAgainMailbox() {
    return this.isConnectAgainMailbox.asObservable();
  }

  setMoveToFolderId(value: string) {
    this.moveToFolderId.next(value);
  }

  getMailBoxIntegrateId() {
    return this.mailBoxIntegrateId$.asObservable();
  }

  setMailBoxIntegrateId(value: string) {
    return this.mailBoxIntegrateId$.next(value);
  }

  get isAllFiltersDisabled$() {
    return this.isAllFiltersDisabled.asObservable();
  }

  setIsAllFiltersDisabled(value: boolean) {
    this.isAllFiltersDisabled.next(value);
  }

  getCurrentMailboxIdToResolveMsg() {
    return this.currentMailboxIdToResolveMsg.asObservable();
  }

  setSkeletonMessage(value: boolean) {
    this.isSkeletonMessage.next(value);
  }

  getSkeletonMessage() {
    return this.isSkeletonMessage.asObservable();
  }

  setCurrentMailboxIdToResolveMsg(id: string) {
    this.currentMailboxIdToResolveMsg.next(id);
  }

  setImportEmailId(value: string) {
    this.importEmailId$.next(value);
  }

  setPopupMoveToTaskState(value: EPopupMoveMessToTaskState) {
    this.popupMoveToTask$.next(value);
  }

  getPopupMoveToTaskState() {
    return this.popupMoveToTask$.asObservable();
  }

  public getSpamFolderImap() {
    return this.spamFolderImap$.asObservable();
  }

  public setSpamFolderImap(value: SpamFolder) {
    this.spamFolderImap$.next(value);
  }

  getIsDisconnectedMailbox() {
    return this.isDisconnectedMailbox.asObservable();
  }

  setIsDisconnectedMailbox(value: boolean) {
    this.isDisconnectedMailbox.next(value);
  }

  getPopupMailBoxState() {
    return this.popupMailBox$.asObservable();
  }

  get isArchiveMailbox$() {
    return this.isArchiveMailbox.asObservable();
  }

  setIsArchiveMailbox(value: boolean) {
    this.isArchiveMailbox.next(value);
  }

  setPopupMailBoxState(value: EMailBoxPopUp) {
    this.popupMailBox$.next(value);
  }

  setCurrentMailBoxId(value: string) {
    if (value !== undefined && this.mailBoxId$.value !== value) {
      this.mailBoxId$.next(value);
    }
  }

  getCurrentMailBoxId() {
    return this.mailBoxId$.asObservable();
  }

  setCurrentMailBox(value: IMailBox) {
    if (this.currentMailBox.value?.id !== value?.id) {
      this.currentMailBox.next(value);
    }
  }

  setCurrentMailBoxIdEmailFolder(value: string) {
    if (value !== undefined && this.mailBoxIdEmailFolder$.value !== value) {
      this.mailBoxIdEmailFolder$.next(value);
    }

    if (value) {
      localStorage.setItem('mailBoxIdEmailFolder', value);
    } else {
      localStorage.removeItem('mailBoxIdEmailFolder');
    }
  }

  getCurrentMailBoxIdEmailFolder() {
    return this.mailBoxIdEmailFolder$.asObservable();
  }

  setCurrentMailBoxEmailFolder(value: IMailBox) {
    this.currentMailBoxEmailFolder.next(value);
  }

  setRefreshEmailFolderMailBox(value: IMailBox) {
    this.refreshEmailFolderMailBox.next(value);
  }

  get refreshEmailFolderMailBox$() {
    return this.refreshEmailFolderMailBox.asObservable();
  }

  get refreshEmailFolderMailBoxValue() {
    return this.refreshEmailFolderMailBox.getValue();
  }

  get currentMailBoxEmailFolder$() {
    return this.currentMailBoxEmailFolder.asObservable();
  }

  get currentMailBox$() {
    return this.currentMailBox.asObservable();
  }

  setMailBoxRole(value: Array<keyof typeof EUserMailboxRole>) {
    this.mailBoxRole$.next(value);
  }

  getMailBoxRole() {
    return this.mailBoxRole$.asObservable();
  }

  onLoading() {
    this.isLoadingMailBox.next(true);
  }

  stopLoading() {
    this.isLoadingMailBox.next(false);
  }

  setSyncMailBoxStatus(value: EMailBoxStatus) {
    this.syncMailBoxStatus.next(value);
  }

  getSyncMailBoxStatus() {
    return this.syncMailBoxStatus.asObservable();
  }

  get listMailBoxs$() {
    return this.listMailBoxs.asObservable();
  }

  get listNotSharedMailBoxes$() {
    return this.listNotSharedMailBoxes.asObservable();
  }

  get listMailBoxsValue() {
    return this.listMailBoxs.getValue();
  }
  setListMailBoxs(value: IMailBox[]) {
    this.listMailBoxs.next(value);
  }

  setListNotSharedMailBoxs(value: IMailBox[]) {
    this.listNotSharedMailBoxes.next(value);
  }

  refreshedListMailBoxs() {
    this.refreshedListMailBoxs$.next(true);
  }

  get conversationSuccess$(): Observable<IListConversationConfirmProperties[]> {
    return this.conversationSuccess.asObservable();
  }

  setConversationSuccess(value: IListConversationConfirmProperties[]) {
    this.conversationSuccess.next(value);
  }

  get taskTemplate$(): Observable<IListTaskTemplate> {
    return this.taskTemplate.asObservable();
  }

  setTaskTemplate(value: IListTaskTemplate) {
    this.taskTemplate.next(value);
  }

  get changeUnreadData$(): Observable<IReadSingleMessage> {
    return this.changeUnreadData.asObservable();
  }

  setChangeUnreadData(value: IReadSingleMessage) {
    this.changeUnreadData.next(value);
  }

  get isOpenPopupAddToTaskBySingleMessage() {
    return this.isOpenPopupAddToTaskBySingleMessage$.asObservable();
  }

  setIsOpenPopupAddToTaskBySingleMessage(value: boolean) {
    this.isOpenPopupAddToTaskBySingleMessage$.next(value);
  }

  public buildFormIntegrateImapServer(): FormGroup {
    return this._formBuilder.group({
      mailBoxId: [''],
      email: ['', [Validators.required]],
      name: ['', [Validators.required]],
      picture: [''],
      password: ['', [Validators.required]],
      inboxServer: this._formBuilder.group({
        host: ['', [Validators.required]],
        port: ['', [Validators.required]],
        protection: [null, [Validators.required]]
      }),
      outboxServer: this._formBuilder.group({
        host: ['', [Validators.required]],
        port: ['', [Validators.required]],
        protection: [null, [Validators.required]]
      })
    });
  }
}
