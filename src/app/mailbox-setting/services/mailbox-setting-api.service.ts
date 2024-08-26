import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { conversations, email } from 'src/environments/environment';
import {
  ICategoryTaskActivity,
  IEmailSignatureSetting,
  IEnquiriesMergePayload,
  IMailboxBehaviours,
  IMailboxSetting,
  IReorderMailBoxList,
  IUpdateAutomateReplyPayload,
  IUpdateChatGPTDetailPayload,
  IUpdateMergeEnquiresPayload,
  ResponsiveTeamPermisson,
  UpdateUserPermission
} from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import { BehaviorSubject, finalize, Observable } from 'rxjs';
import { MailboxSettingService } from './mailbox-setting.service';
import { users } from 'src/environments/environment';
import queryString from 'query-string';
import {
  EAiConciseSetting,
  EAiToneSetting
} from '@/app/mailbox-setting/enum/mailbox-setting.enum';

@Injectable({
  providedIn: 'root'
})
export class MailboxSettingApiService {
  constructor(
    private apiService: ApiService,
    private mailboxSettingService: MailboxSettingService
  ) {}

  public isSaveConversationMailbox$: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public isRefreshSaveConversationMailbox$: BehaviorSubject<boolean> =
    new BehaviorSubject(false);

  getListActiveTeamMember(
    mailBoxId: string,
    page = 0,
    size = 40
  ): Observable<ResponsiveTeamPermisson> {
    return this.apiService.getAPI(
      email,
      `get-list-active-team-member?page=${page}&size=${size}&mailBoxId=${mailBoxId}`
    );
  }

  updateListActiveTeamMember(
    mailBoxId: string,
    data: UpdateUserPermission[]
  ): Observable<{ teamMembers: number }> {
    return this.apiService.putAPI(
      email,
      `update-role-permission/${mailBoxId}`,
      {
        permissionUpdate: data
      }
    );
  }

  updateMailboxName(mailBoxId: string, name: string) {
    return this.apiService.postAPI(email, 'mail-box/update-name', {
      mailBoxId,
      name
    });
  }

  archiveMailbox(mailBoxId: string) {
    return this.apiService.postAPI(email, `remove-mail-box/${mailBoxId}`, {
      mailBoxId
    });
  }

  saveMailboxSignature(mailBoxId: string, variables: IEmailSignatureSetting) {
    return this.apiService.postAPI(email, 'save-mail-box-setting/signature', {
      mailBoxId,
      mailSignature: variables
    });
  }

  saveMailboxBehaviours(mailBoxId: string, behaviours: IMailboxBehaviours) {
    return this.apiService.postAPI(email, 'save-mail-box-setting/behavior', {
      mailBoxId,
      mailBehavior: behaviours
    });
  }

  getMailboxBehavioursLabelLists(mailboxId: string) {
    return this.apiService.getAPI(email, `get-mail-box-label/${mailboxId}`);
  }

  getMailboxSetting(mailboxId: string): Observable<IMailboxSetting> {
    this.mailboxSettingService.setIsLoadingSetting(true);
    return this.apiService
      .getAPI(email, `get-mail-box-setting/${mailboxId}`)
      .pipe(
        finalize(() => {
          this.mailboxSettingService.setIsLoadingSetting(false);
        })
      );
  }

  get agencyIdFromLocalStorage() {
    return localStorage.getItem('agencyId');
  }

  getOutOfOffice(mailboxId: string): Observable<any> {
    return this.apiService.get(`${users}pm-responder?mailBoxId=${mailboxId}`);
  }

  updateOutOfOffice(body: any) {
    return this.apiService.post(`${users}pm-responder`, body);
  }

  turnOffOutOfOffice(outOfOfficeId: string | number) {
    return this.apiService.delete(`${users}pm-responder/${outOfOfficeId}`);
  }

  getMailboxPreferencesSetting(mailboxId: string) {
    return this.apiService.getAPI(email, `mail-box-behavior/${mailboxId}`);
  }

  updateChatgptDetail(payload: IUpdateChatGPTDetailPayload) {
    return this.apiService.postAPI(
      conversations,
      `update-chatgpt-detail`,
      payload
    );
  }

  getChatGPTDetail(answerId: string) {
    return this.apiService.getAPI(conversations, `chatgpt-detail/${answerId}`);
  }

  updateAutomateReply(payload: IUpdateAutomateReplyPayload) {
    return this.apiService.postAPI(
      conversations,
      `update-automate-reply`,
      payload
    );
  }

  updateMergeEnquires(payload: IUpdateMergeEnquiresPayload) {
    return this.apiService.postAPI(conversations, `merge-enquires`, payload);
  }

  getSimilarQuestion(payload: IEnquiriesMergePayload) {
    const query = queryString.stringify(payload, {
      skipEmptyString: true
    });
    return this.apiService.postAPI(
      conversations,
      `get-question-similar?${query}`,
      payload
    );
  }

  getCategorySaveTaskActivity(): Observable<ICategoryTaskActivity[]> {
    return this.apiService.getAPI(conversations, 'get-list-category-document');
  }

  public getAiSettings(mailboxId: string) {
    return this.apiService.getAPI(
      conversations,
      `get-ai-setting?mailBoxId=${mailboxId}`
    );
  }

  public changeAiSettings(payload: {
    mailBoxId: string;
    id: string;
    tone: EAiToneSetting;
    length: EAiConciseSetting;
  }) {
    return this.apiService.postAPI(
      conversations,
      'save-change-ai-setting',
      payload
    );
  }

  public reorderMailboxList(payload: IReorderMailBoxList[]) {
    return this.apiService.putAPI(email, 'mailbox/update-mailboxes', payload);
  }
}
