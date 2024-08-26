import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  Subject,
  pluck,
  switchMap,
  tap
} from 'rxjs';
import { AppRoute } from '@/app/app.route';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import {
  ConfigPlan,
  ITotalCountConversationLogs
} from '@/app/console-setting/agencies/utils/console.type';
import { stringFormat } from '@core';
import { IGetListTopic } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { ApiService } from '@services/api.service';
import { TaskStatusType } from '@shared/enum/task.enum';
import { GroupType } from '@shared/enum/user.enum';
import {
  AgentSettingInfo,
  ISettingTaskActivityLogPayload,
  ISettingTaskActivityResponse
} from '@shared/types/agency.interface';
import {
  IGetTaskPayload,
  IListTaskTemplate
} from '@shared/types/task.interface';
import { agencies, users } from 'src/environments/environment';
import { ICreditor } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-invoice.interface';
import { CalendarToolbarService } from '@/app/dashboard/modules/calendar-dashboard/services/calendarToolbar.service';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { CompanyService } from '@services/company.service';
import { ICompany } from '@shared/types/company.interface';
import { ITrustAccountPayload } from '@shared/types/user.interface';
import { Team } from '@/app/shared';
@Injectable({
  providedIn: 'root'
})
export class AgencyService {
  private creditor: BehaviorSubject<ICreditor[]> = new BehaviorSubject<
    ICreditor[]
  >([]);
  public topicList$: BehaviorSubject<IGetListTopic> = new BehaviorSubject(null);
  private refreshGetListTopic = new BehaviorSubject(null);
  private refreshListTask = new BehaviorSubject(null);
  public listTask$ = new BehaviorSubject<IListTaskTemplate>(null);
  private currentPlan = new BehaviorSubject<ConfigPlan>(null);
  public currentPlan$ = this.currentPlan.asObservable();
  whenAgencyChange$ = new BehaviorSubject('');
  public environment: BehaviorSubject<string> = new BehaviorSubject('');
  public getPhoneNumberMinLength: BehaviorSubject<number> = new BehaviorSubject(
    10
  );
  public triggerResetSearchContact$: Subject<boolean> = new Subject<boolean>();
  private listAssignSelected = new BehaviorSubject<Team[]>([]);

  constructor(
    private apiService: ApiService,
    private router: Router,
    private inboxFilterService: InboxFilterService,
    private calendarToolbarService: CalendarToolbarService,
    private companyService: CompanyService
  ) {}

  getCreditor(): Observable<ICreditor[]> {
    return this.creditor.asObservable();
  }

  setCreditor(creditor: ICreditor[]) {
    this.creditor.next(creditor);
  }

  getListAssignSelected(): Observable<Team[]> {
    return this.listAssignSelected.asObservable();
  }

  setListAssignSelected(listAssignSelected: Team[]) {
    this.listAssignSelected.next(listAssignSelected);
  }

  updateRememberTaskTemplate(rememberTask) {
    const listTask = this.listTask$.getValue();
    const taskIndex = listTask.PUBLISHED.findIndex(
      (task) => task.id === rememberTask.taskNameId
    );
    listTask.PUBLISHED[taskIndex].defaultTaskFolder = {
      id: rememberTask?.id,
      taskFolderId: rememberTask?.taskFolderId,
      isRemember: true
    };
    this.listTask$.next(listTask);
  }

  getWorkingHoursExist(): Observable<any> {
    return this.apiService.get(`${users}get-pm-schedule-by-region-exist`).pipe(
      tap((response: any) => {
        return response;
      })
    );
  }

  handleChangeCurrentCompany(
    companyId,
    callback?: () => void,
    company?: ICompany
  ) {
    localStorage.setItem('companyId', companyId);
    const oldCompanyId = this.companyService.currentCompanyId();
    const currentInboxType = this.inboxFilterService.getSelectedInboxType();
    this.companyService.setCurrentCompanyId(companyId);
    const [baseURL, queryParams] = this.router.url.split('?');
    const isMailFolder = baseURL.includes('/inbox/mail');
    const params = new URLSearchParams(queryParams);
    params.delete('assignedTo');
    params.delete('propertyManagerId');
    params.delete('messageStatus');
    params.delete('search');
    if (companyId !== oldCompanyId) {
      let newBaseURL = baseURL;
      params.delete('mailBoxId');
      params.delete('channelId');
      if (baseURL.includes('/tasks') && queryParams.includes('taskTypeID')) {
        params.delete('taskTypeID');
      }

      if (baseURL.includes('/inbox/detail')) {
        newBaseURL = stringFormat(AppRoute.MESSAGE_INDEX, companyId);
      }

      this.calendarToolbarService.setEventSelectedList([]);

      let newUrl = (newBaseURL + '?' + params.toString()).replace(
        oldCompanyId,
        companyId
      );
      newUrl = newUrl.replace(currentInboxType, GroupType.MY_TASK);
      if (isMailFolder) {
        const url = `${stringFormat(
          AppRoute.MESSAGE_INDEX,
          companyId
        )}?status=${TaskStatusType.inprogress}&inboxType=${GroupType.MY_TASK}`;
        this.router.navigateByUrl(url);
        return;
      }
      const routeRentManagerCRM = ['tenant-prospect', 'landlords-prospect'];
      const defaultRouterPT = '/dashboard/contacts/tenants-landlords';
      const isNavigateDefault =
        routeRentManagerCRM.includes(newUrl.split('/')[2].split('?')[0]) &&
        !this.isRentManagerCRM(company);
      this.router.navigateByUrl(isNavigateDefault ? defaultRouterPT : newUrl);
    } else if (callback) {
      callback();
    }
  }

  updateCompanyDetails(body) {
    return this.apiService.postAPI(agencies, 'update-company-detail', body);
  }

  getAgencySetting(): Observable<AgentSettingInfo> {
    return this.apiService
      .getData<AgentSettingInfo>(`${agencies}detail`)
      .pipe(pluck('body'));
  }

  getListTaskNames(payload: Partial<IGetTaskPayload>) {
    return this.refreshListTask.pipe(
      switchMap(() => {
        return this.apiService.postAPI(agencies, 'get-list-task-names', {
          pageIndex: 0,
          pageSize: 1000,
          ...payload
        });
      })
    );
  }

  getListTopic() {
    return this.refreshGetListTopic
      .asObservable()
      .pipe(switchMap(() => this.apiService.getAPI(agencies, `topics`)))
      .subscribe((res) => {
        this.topicList$.next(res);
      });
  }

  refreshListTaskData() {
    this.refreshListTask.next(null);
  }

  refreshListTopicData() {
    this.refreshGetListTopic.next(null);
  }

  updateListFolders(listFolders) {
    return this.apiService.putAPI(agencies, `topics`, listFolders);
  }

  synchronizePlan(): Observable<ConfigPlan> {
    return this.apiService.getAPI(agencies, `get-plan`);
  }

  get agencyIdFromLocalStorage() {
    return localStorage.getItem('agencyId') || null;
  }

  isRentManagerCRM(company: any) {
    return company?.CRM === ECrmSystemId[ECRMSystem.RENT_MANAGER];
  }

  setCurrentPlan(value: ConfigPlan) {
    this.currentPlan.next(value);
  }

  updateCurrentPlan(value: ConfigPlan) {
    this.currentPlan.next({ ...this.currentPlan.value, ...value });
  }

  updateCountPlan(value: ITotalCountConversationLogs) {
    const currentPlan = this.currentPlan.getValue();
    if (!currentPlan || !currentPlan.totalCountConversationLogs) return;

    this.currentPlan.next({
      ...currentPlan,
      totalCountConversationLogs: currentPlan.totalCountConversationLogs.map(
        (log) =>
          log.mailBoxId === value.mailBoxId ? { ...log, ...value } : log
      )
    });
  }

  getIsShowAIIntroduce(userId: string) {
    return this.apiService.getAPI(
      agencies,
      `get-is-show-ai-introduce?userId=${userId}`
    );
  }

  updateIsShowAIIntroduce(body: { userId: string }) {
    return this.apiService.postAPI(
      agencies,
      'update-is-show-ai-introduce',
      body
    );
  }

  getListAgencyActive() {
    return this.apiService.getAPI(agencies, `team?filterStatus=ACTIVE`);
  }
  getSettingTaskActivityLog(): Observable<ISettingTaskActivityResponse> {
    return this.apiService.getAPI(agencies, 'get-setting-task-activity');
  }

  updateSettingTaskActivityLog(body: ISettingTaskActivityLogPayload) {
    return this.apiService.postAPI(
      agencies,
      'update-setting-task-activity',
      body
    );
  }

  createTrustAccount(account: ITrustAccountPayload) {
    return this.apiService.postAPI(agencies, 'trust-account', account);
  }

  updateTrustAccount(account: ITrustAccountPayload) {
    return this.apiService.putAPI(agencies, 'trust-account', account);
  }
}
