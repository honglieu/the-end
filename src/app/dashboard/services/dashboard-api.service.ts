import { UserService } from './../../services/user.service';
import { catchError, filter, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import {
  agencies,
  conversations,
  email,
  users
} from 'src/environments/environment';
import { Observable, of, map } from 'rxjs';
import { EMailBoxType, EmailProvider } from '@shared/enum/inbox.enum';
import {
  IEmailImport,
  IEmailImportPayload
} from '@/app/share-pop-up/email-import-pop-up/interfaces/import-email.interface';
import { FilesService } from '@services/files.service';
import { ImapForm } from '@shared/types/inbox.interface';
import {
  ICreateFolderMailBoxPayload,
  ICreateFolderPayload,
  IGetFolderUnreadMessagePayload,
  IGetTaskByFolder,
  IGetTaskByFolderPayload,
  IGlobalStatisticTask,
  ITaskFolder,
  IUpdateFolder,
  IUpdateFolderMailBoxPayload,
  TaskFolderResponse
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { PortfolioService } from './portfolio.service';
import { CompanyService } from '@services/company.service';
import {
  IGlobalSearchPayload,
  IGlobalSearchResponse
} from '@/app/dashboard/components/global-search/interfaces/global-search.interface';
import { IPortfoliosGroups } from '@/app/profile-setting/portfolios/interfaces/portfolios.interface';
import { Agent } from '@shared/types/agent.interface';
import { IEmailLabelResponse } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { IUserOnboarding } from '@/app/shared/types/user.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardApiService {
  private cacheListOfAgent = new Map<string, Agent[]>();

  constructor(
    private apiService: ApiService,
    private userService: UserService,
    private fileService: FilesService,
    private portfolioService: PortfolioService,
    private companyService: CompanyService
  ) {}

  getUserDetail() {
    // TODO: move services/user.service to dashboard userService
    if (this.userService.userInfo$?.value) {
      return of(this.userService.userInfo$.value);
    }
    return this.apiService.getAPI(users, 'current-user').pipe(
      tap((user) => {
        const companyAgents = user.companyAgents;
        if (companyAgents.length === 1) {
          this.companyService.setCurrentCompanyId(
            companyAgents?.[0]?.companyId
          );
        } else {
          const companyId = localStorage['companyId'];
          const currentCompany = companyAgents.find(
            (companyAgent) => companyAgent.companyId === companyId
          );
          if (currentCompany) {
            this.companyService.setCurrentCompanyId(companyId);
          } else {
            this.companyService.setCurrentCompanyId(
              companyAgents?.[0]?.companyId
            );
          }
        }
        this.userService.userInfo$.next(user);
      })
    );
  }

  getUserAgencies(userId: string) {
    return this.apiService.getAPI(agencies, 'user-agencies?userId=' + userId);
  }

  getPortfolios(): Observable<IPortfoliosGroups[]> {
    return this.apiService.getAPI(users, `v2/get-list-portfolios`).pipe(
      tap((portfoliosGroups: IPortfoliosGroups[]) => {
        const softFn = (
          portfolioGroupA: IPortfoliosGroups,
          portfolioGroupB: IPortfoliosGroups
        ) => {
          const groupNameA: string = portfolioGroupA.name.trim().toLowerCase();
          const groupNameB: string = portfolioGroupB.name.trim().toLowerCase();
          return groupNameA.localeCompare(groupNameB);
        };
        this.portfolioService.setPortfolios(portfoliosGroups.sort(softFn));
      })
    );
  }

  getCalendarEventTaskApi() {
    return this.apiService.getAPI(
      conversations,
      'calendar/get-list-event-type'
    );
  }

  getListAgentPopup(): Observable<Agent[]> {
    const cacheKey = localStorage.getItem('companyId');
    if (this.cacheListOfAgent.has(cacheKey)) {
      return of(this.cacheListOfAgent.get(cacheKey));
    }
    return this.apiService
      .getData<{ list: Agent[] }>(`${users}v3/list-of-agent`)
      .pipe(
        map((res) => (Array.isArray(res?.body?.list) ? res.body.list : [])),
        tap((res) => {
          if (Array.isArray(res)) {
            this.cacheListOfAgent.set(cacheKey, res);
          }
        })
      );
  }

  getStatisticGlobalTask(): Observable<IGlobalStatisticTask> {
    return this.apiService.getAPI(conversations, 'statistic-global-task');
  }

  getStatisticTask(mailBoxId?: string) {
    return this.apiService.getAPI(
      conversations,
      `v4/statistic-task?${mailBoxId ? `mailBoxId=${mailBoxId}` : ''}`
    );
  }

  getStatisticTaskChannel(channelId?: string) {
    return this.apiService.getAPI(
      conversations,
      `statistic-task-channel?${channelId ? `channelId=${channelId}` : ''}`
    );
  }

  getStatisticTaskReminder(mailBoxId: string) {
    return this.apiService.getAPI(
      conversations,
      `v4/statistic-task-reminder?mailBoxId=${mailBoxId}`
    );
  }

  getSSOZendesk() {
    return this.apiService.getAPI(users, 'sso/zendesk');
  }

  getSSOZendeskWidget() {
    return this.apiService.getAPI(users, 'sso/zendesk/widget');
  }

  get agencyIdFromLocalStorage() {
    return localStorage.getItem('agencyId') || null;
  }

  getRegions(params: { crmSystemId?: string }) {
    return this.apiService.getAPI(users, 'get-list-region', params);
  }

  integrateEmailProvider(
    params: {
      code?: string;
      type?: EMailBoxType;
    },
    emailProvider: EmailProvider
  ) {
    return this.apiService.postAPI(
      email,
      `mailbox/integrate-${emailProvider.toLowerCase()}`,
      params
    );
  }

  integrateCalendarProvider(params: { code?: string; type?: EmailProvider }) {
    return this.apiService.postAPI(
      conversations,
      'calendar/integrate-setting',
      params
    );
  }

  connectAgainCalendar(params: {
    code: string;
    type: string;
    userCalendarSettingId: string;
  }) {
    return this.apiService.postAPI(
      conversations,
      '/calendar/reconnect-integration',
      params
    );
  }

  retryCalendar(userCalendarSettingId: string) {
    return this.apiService.postAPI(
      conversations,
      '/calendar/retry-integration',
      {
        userCalendarSettingId
      }
    );
  }

  disconnectCalendar(userCalendarSettingId: string) {
    return this.apiService.postAPI(
      conversations,
      '/calendar/disconnect-integration',
      {
        userCalendarSettingId
      }
    );
  }

  getCalendarDataApi() {
    return this.apiService.get(`${conversations}calendar/get-setting`).pipe(
      tap((response: any) => {
        return response;
      })
    );
  }

  closePopupCalendar() {
    return this.apiService.postAPI(conversations, 'calendar/close-banner', {});
  }

  generateIcsLink() {
    return this.apiService.postAPI(
      conversations,
      'calendar/subscribe-calendar',
      {}
    );
  }

  retrySyncMailBox(mailBoxId: string) {
    return this.apiService.postAPI(email, 'mailbox/retry-integrate', {
      mailBoxId
    });
  }

  public syncIMAP(mailBoxId: string) {
    return this.apiService.postAPI(email, 'mailbox/sync-imap', {
      mailBoxId
    });
  }

  syncMailBox(mailBoxId: string) {
    return this.apiService.postAPI(email, 'mailbox/sync', {
      mailBoxId
    });
  }

  connectMailboxAgain(params: {
    code: string;
    type: string;
    mailBoxId: string;
  }) {
    return this.apiService.postAPI(email, 'mailbox/reconnect', params);
  }

  public retrySyncImap(mailBoxId: string) {
    return this.apiService.postAPI(email, 'mailbox/retry-integrate-imap', {
      mailBoxId
    });
  }

  getEmailImportScanning(body: FormData): Observable<IEmailImport> {
    return this.apiService
      .postFormAPI(conversations, 'email-import/process', body)
      .pipe(
        filter((res) => !!res),
        map((res: IEmailImport) => {
          const data: IEmailImport = {
            ...res,
            textContent: res.textContent?.replace(/\n/g, '') || '',
            files:
              res.files?.map((f) => ({
                ...f,
                mediaType: this.fileService.getFileTypeSlash(f.fileType),
                icon: this.fileService.getFileIcon(f.fileName),
                mediaLink: f.content
              })) || []
          };
          return data;
        })
      );
  }

  importMailBox(body: IEmailImportPayload) {
    return this.apiService.postAPI(
      conversations,
      'email-import/create-message',
      body
    );
  }

  getListMailbox() {
    return this.apiService.getAPI(email, 'agency-agent/list-mailbox');
  }

  getListArchivedFacebookChannel() {
    return this.apiService.getAPI(agencies, 'list-archived-facebook-channel');
  }

  getListArchivedWhatsAppChannel() {
    return this.apiService.getAPI(agencies, 'list-archived-whatsapp-channel');
  }

  public integrateIMAP(payload: ImapForm) {
    return this.apiService.postAPI(email, 'mailbox/integrate-imap', payload);
  }

  public getImapSetting(mailboxId: string) {
    return this.apiService.get(`${email}mailbox/imap/detail/${mailboxId}`);
  }

  public reconnectImap(payload: ImapForm) {
    return this.apiService.postAPI(email, 'mailbox/imap/reconnect', payload);
  }

  getTaskFolders(companyId: string): Observable<TaskFolderResponse> {
    return this.apiService
      .getAPI(conversations, `tasks/v2/task-folder?companyId=${companyId}`)
      .pipe(
        map((response) => ({
          taskFolders: response,
          payload: { companyId }
        }))
      );
  }

  getTaskByFolder(
    body: IGetTaskByFolderPayload
  ): Observable<IGetTaskByFolder[]> {
    return this.apiService.postAPI(
      conversations,
      'tasks/v2/get-tasks-by-folder',
      body
    );
  }

  createTaskFolder(body: ICreateFolderPayload): Observable<ITaskFolder> {
    return this.apiService.postAPI(
      conversations,
      'tasks/v2/create-task-folder',
      body
    );
  }

  updateTaskFolder(body: IUpdateFolder[]) {
    return this.apiService.putAPI(
      conversations,
      'tasks/v2/update-task-folders',
      body
    );
  }

  deleteTaskFolder(taskFolderId: string, companyId: string) {
    return this.apiService.deleteAPI(
      conversations,
      `tasks/v2/delete-task-folder?taskFolderId=${taskFolderId}&companyId=${companyId}`
    );
  }

  public getLabels(mailBoxId: string): Observable<IEmailLabelResponse> {
    return this.apiService.get(`${email}mailbox/mail-folder`, {
      mailBoxId
    });
  }

  public getFolderUnreadMessagesCount(
    mailboxId: string,
    labelId?: string
  ): Observable<IEmailLabelResponse> {
    let params: IGetFolderUnreadMessagePayload = {
      mailBoxId: mailboxId
    };
    if (labelId) {
      params.labelId = labelId;
    }
    return this.apiService.get(`${email}mailbox/unread-message`, params);
  }

  public combineGetEmailFolders(mailboxId: string) {
    const handleError = (error: {}) => {
      console.error(error);
      return of([]);
    };
    const labels$ = this.getLabels(mailboxId).pipe(catchError(handleError));
    return labels$;
  }

  createMailBoxFolder(
    body: ICreateFolderMailBoxPayload
  ): Observable<ITaskFolder> {
    return this.apiService.postAPI(email, 'mailbox/mail-folder', body);
  }

  updateMailBoxFolder(
    body: IUpdateFolderMailBoxPayload
  ): Observable<ITaskFolder> {
    return this.apiService.putAPI(email, 'mailbox/mail-folder', body);
  }

  deleteMailBoxFolder({ folderId, mailBoxId }): Observable<ITaskFolder> {
    return this.apiService.deleteAPI(email, 'mailbox/mail-folder', {
      folderId,
      mailBoxId
    });
  }

  addSharedMailbox(params: { mailBoxId?: string; shareTo?: string }) {
    return this.apiService.postAPI(email, 'mailbox/add-shared-mailbox', params);
  }

  updateOnboardingDefaultData(body: IUserOnboarding) {
    return this.apiService.putAPI(users, 'onboarding-default-data', body);
  }

  getGlobalSearchData(
    payload: IGlobalSearchPayload
  ): Observable<IGlobalSearchResponse> {
    return this.apiService.postAPI(
      conversations,
      'global-search-conversations',
      payload
    );
  }
}
