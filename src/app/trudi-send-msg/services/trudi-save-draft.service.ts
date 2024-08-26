import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { conversations } from 'src/environments/environment';
import {
  IBodyFile,
  ISelectedReceivers,
  ISendManyMsgPayload,
  ISendMsgPayload,
  ISendMsgResponseV2
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ApiService } from '@services/api.service';
import { EConversationType, TaskType } from '@shared/enum';
import { DRAFT_SAVED } from '@services/messages.constants';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { ToastrService } from 'ngx-toastr';
import { LocalFile } from '@services/files.service';
import { ConversationService } from '@services/conversation.service';
import { IFile } from '@shared/types/file.interface';
import { HelperService } from '@services/helper.service';

@Injectable({
  providedIn: 'root'
})
export class TrudiSaveDraftService {
  private isLoadingUploadFile$ = new BehaviorSubject<boolean>(false);
  private listFileUploaded = [];
  public sessionId$ = new BehaviorSubject<string>(null);
  public draftMsgId$ = new BehaviorSubject<string>(null);
  public trackControlChanges = {
    sendMsgForm: false,
    selectedReceivers: false,
    msgTitle: false,
    msgContent: false,
    contact: false,
    crmFile: false,
    reiForm: false,
    listOfFiles: false,
    property: false
  };
  public cacheListAttachment = [];
  public triggerControlChange$ = new Subject();
  private isSavedDraftMsg$ = new BehaviorSubject<boolean>(false);
  private handleTriggerBodyAfterSaveDraft = new Subject<ISendMsgPayload>();
  public triggerDraftBody$ =
    this.handleTriggerBodyAfterSaveDraft.asObservable();

  getIsSavedDraftMsg() {
    return this.isSavedDraftMsg$.asObservable();
  }

  setIsSavedDraftMsg(value: boolean) {
    return this.isSavedDraftMsg$.next(value);
  }

  constructor(
    private apiService: ApiService,
    private toastCustomService: ToastCustomService,
    private conversationService: ConversationService,
    private toastService: ToastrService,
    private helper: HelperService
  ) {}

  get isLoadingUploadFile() {
    return this.isLoadingUploadFile$.getValue();
  }

  setTrackControlChange(key: string, value: boolean) {
    this.trackControlChanges[key] = value;
    if (value) {
      this.triggerControlChange$.next(true);
    }
  }

  get hasControlChanges() {
    for (const key in this.trackControlChanges) {
      if (this.trackControlChanges[key]) return true;
    }
    return false;
  }

  set isLoadingUploadFile(value: boolean) {
    this.isLoadingUploadFile$.next(value);
  }

  setListFileUploaded(value: LocalFile[] | IBodyFile[]) {
    this.listFileUploaded = value;
  }

  getListFileUploaded() {
    return this.listFileUploaded;
  }

  get getSessionId() {
    return this.sessionId$.getValue();
  }

  setSessionId(value: string) {
    this.sessionId$.next(value);
  }

  get getDraftMsgId() {
    return this.draftMsgId$.getValue();
  }

  setDraftMsgId(value: string) {
    this.draftMsgId$.next(value);
  }

  resetTrackControl() {
    this.trackControlChanges = {
      sendMsgForm: false,
      selectedReceivers: false,
      msgTitle: false,
      msgContent: false,
      contact: false,
      crmFile: false,
      reiForm: false,
      listOfFiles: false,
      property: false
    };
  }

  saveDraft(
    body: ISendMsgPayload,
    isShowToast: boolean = false,
    isFromDraftFolder
  ): Observable<ISendMsgPayload | ISendMsgResponseV2> {
    return this.apiService.postAPI(conversations, 'new-message', body).pipe(
      tap((response) => {
        this.handleTriggerBodyAfterSaveDraft.next(body);
        if (response) this.setIsSavedDraftMsg(true);
        if (isShowToast) {
          const data = response as ISendMsgResponseV2;
          const isTaskDetail = this.helper.isInboxDetail;
          if (
            (data?.message?.replyToMessageId &&
              ![
                EConversationType.SMS,
                EConversationType.MESSENGER,
                EConversationType.VOICE_MAIL,
                EConversationType.WHATSAPP,
                EConversationType.EMAIL
              ].includes(data?.message?.replyConversationType)) ||
            isFromDraftFolder
          ) {
            this.toastService.success(DRAFT_SAVED);
          } else {
            if (isTaskDetail) {
              this.conversationService.previousConversation$.next({
                ...response.conversation,
                isTabDraft: true
              });
            } else {
              this.toastCustomService.handleShowToastForDraft(response);
            }
          }
        }
      })
    );
  }

  saveManyDraft(
    body: ISendManyMsgPayload,
    isShowToast: boolean = false
  ): Observable<ISendManyMsgPayload | ISendMsgResponseV2[]> {
    return this.apiService
      .postAPI(conversations, 'new-many-message', body)
      .pipe(
        tap((response) => {
          if (isShowToast) {
            const data = response as unknown as ISendMsgResponseV2[];
            if (data?.[0]?.task?.type === TaskType.TASK) {
              this.toastService.success(DRAFT_SAVED);
              return;
            }
            if (data.length === 1) {
              this.toastCustomService.handleShowToastForDraft(data[0]);
            } else {
              this.toastService.success(DRAFT_SAVED);
            }
          }
        })
      );
  }

  getDraftData(
    draftMsgId: string
  ): Observable<{ contacts: ISelectedReceivers[]; attachments: IFile[] }> {
    return this.apiService.getAPI(
      conversations,
      `get-draft-data?messageId=${draftMsgId}`
    );
  }
}
