import { Injectable, OnDestroy } from '@angular/core';
import * as Sentry from '@sentry/angular-ivy';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import {
  catchError,
  map,
  pluck,
  retry,
  takeUntil,
  tap,
  timeout
} from 'rxjs/operators';
import {
  IInputToGetSupplier,
  ISupplierBasicInfo,
  IUsersSupplierBasicInfoProperty
} from '@shared/types/users-supplier.interface';
import {
  conversations,
  email,
  properties,
  users
} from 'src/environments/environment';
import { IEvents } from '@/app/profile-setting/integrations/constants/constants';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { EUserPropertyType, UserTypeEnum } from '@shared/enum/user.enum';
import { EUserInviteStatusType } from '@shared/enum/userType.enum';
import {
  SupplierItemDropdown,
  Suppliers
} from '@shared/types/agency.interface';
import { Agent } from '@shared/types/agent.interface';
import {
  OtherContact,
  OtherContactDropdown
} from '@shared/types/other-contact.interface';
import { ResponseTrudiContact } from '@shared/types/trudi.interface';
import { PropertyContact } from '@shared/types/unhappy-path.interface';
import { AgentFileProp } from '@shared/types/user-file.interface';
import {
  CompanyAgentCurrentUser,
  AssignedTopic,
  BankAccount,
  CountUser,
  CurrentUser,
  NotificationSettingApiResponse
} from '@shared/types/user.interface';
import { Email } from '@/app/task-detail/components/forward-via-email/forward-via-email.component';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { consoleUserRole } from './constants';
import { LocalStorageService } from './local.storage';
import { captureExceptionToSentry } from '@/app/sentry';
import { SecondaryEmail } from '@shared/types/users-by-property.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService implements OnDestroy {
  // TODO: move services/user.service to dashboard userService
  private subscribers = new Subject<void>();
  public selectedUser: BehaviorSubject<any> = new BehaviorSubject({});
  public selectedUserAvatar: BehaviorSubject<any> = new BehaviorSubject(
    this._localStorageService.getValue('AgentAvatar')
  );
  private filesList = new BehaviorSubject<AgentFileProp[]>([]);
  public userInfo$ = new BehaviorSubject<CurrentUser>(null);
  public assignedTopics$ = new BehaviorSubject<AssignedTopic[]>([]);
  public isDeletedEmail$: BehaviorSubject<string> = new BehaviorSubject<string>(
    ''
  );
  public isAddEmail$: BehaviorSubject<SecondaryEmail> =
    new BehaviorSubject<SecondaryEmail>(null);
  public pmPortalIsDeleted = false;
  public tenancyId$: BehaviorSubject<string> = new BehaviorSubject<string>(
    null
  );
  public currentAgencyId: string;
  private listUserCache = {
    data: [],
    taskId: null
  };
  public searchText$: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('searchText') || ''
  );
  public fieldCRMStatusTenantProspect$: BehaviorSubject<any> =
    new BehaviorSubject<any>(null);
  private isDeleteUser$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  private isDeletePhoneNumber$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  private cacheListOfAgent = new Map<string, Agent[]>();

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly _localStorageService: LocalStorageService
  ) {}

  setSearchText(search: string) {
    if (search !== null && search !== this.searchText$.getValue()) {
      this.searchText$.next(search);
      localStorage.setItem('searchText', search);
    }
  }

  getSearchText() {
    return this.searchText$.asObservable();
  }

  setCurrentUser(enableTimeSkip: boolean = true) {
    const TIME_SKIP_CALL_API = 10000; //10s
    if (!this.authService.isAuthenticated()) return of();
    return this.apiService.getAPI(users, 'current-user').pipe(
      enableTimeSkip ? timeout(TIME_SKIP_CALL_API) : tap(),
      retry({
        count: 2
      }),
      catchError((error) => {
        captureExceptionToSentry(
          {
            message: 'FORCED_LOGOUT:ERROR Get current user timeout',
            error
          },
          { level: 'error' }
        );
        return of('timeout');
      }),
      tap((res) => {
        if (!res) return;
        if (res.id !== this.userInfo$?.value?.id) {
          Sentry.setUser({ id: res.id, email: res.email });
        }
        this.userInfo$.next(res);
        this._localStorageService.setValue('userId', res.id);
        this.checkPmPortalIsDeleted();
      })
    );
  }

  handleUpdateRoleRealTime(userId: string) {
    if (this.userInfo$?.value.id === userId) {
      return this.setCurrentUser(false);
    }
    return of();
  }

  getUserInfo() {
    const currentUser = this.selectedUser.getValue();
    if (currentUser && currentUser.id) {
      if (currentUser.id !== this.userInfo$?.value?.id) {
        Sentry.setUser({ id: currentUser.id, email: currentUser.email });
      }
      this.userInfo$.next(currentUser);
      this._localStorageService.setValue('userId', currentUser.id);
      this.checkPmPortalIsDeleted();
      return currentUser;
    }
    return null;
  }

  updateUserProfile(
    name: string,
    title: string,
    phoneNumber: string,
    imageSignature: Object
  ) {
    return this.apiService.putAPI(users, 'update-profile', {
      name,
      title,
      phoneNumber,
      imageSignature
    });
  }

  checkMailboxIsExist(mailBoxId: string) {
    return this.apiService.postAPI(
      email,
      'mailbox/check-is-exists-mailbox-member',
      { mailBoxId }
    );
  }

  getAllMailboxAssignee() {
    return this.apiService.getAPI(email, 'get-all-mailbox-assignee');
  }

  getBankAccount() {
    return this.apiService.getAPI(users, 'get-bank-account/');
  }

  addBankAccount(
    accountName: string,
    bsb: string,
    accountNumber: string
  ): Observable<BankAccount> {
    return this.apiService.postAPI(users, 'create-bank-account', {
      accountName,
      bsb,
      accountNumber
    });
  }

  deleteBankAccount(bankAccountId: string): Observable<{ message: string }> {
    return this.apiService.deleteAPI(users, 'delete-bank-account', {
      bankAccountId
    });
  }

  updateUserData(userId: string, title: string) {
    return this.apiService.putAPI(users, 'update-data-user', { userId, title });
  }

  updateBankAccount(
    accountName: string,
    bsb: string,
    accountNumber: string,
    bankAccountId: string
  ): Observable<BankAccount> {
    return this.apiService.putAPI(users, 'edit-bank-account', {
      accountName,
      bsb,
      accountNumber,
      bankAccountId
    });
  }

  getListAgentPopup(
    mailBoxId?: string,
    skipCacheData?: boolean
  ): Observable<Agent[]> {
    const cacheKey = mailBoxId || localStorage.getItem('companyId');
    if (this.cacheListOfAgent.has(cacheKey) && !skipCacheData) {
      return of(this.cacheListOfAgent.get(cacheKey));
    }
    return this.apiService
      .getData<{ list: Agent[] }>(
        `${users}v3/list-of-agent?&mailBoxId=${mailBoxId || ''}`
      )
      .pipe(
        map((res) => (Array.isArray(res.body.list) ? res.body.list : [])),
        tap((res) => {
          if (Array.isArray(res)) {
            this.cacheListOfAgent.set(cacheKey, res);
          }
        })
      );
  }

  getListAgent(search = '') {
    return this.apiService
      .getData<Agent[]>(`${users}v2/list-of-agent?search=${search}`)
      .pipe(pluck('body'));
  }

  getAssignedTopics() {
    this.apiService
      .getData<AssignedTopic[]>(`${users}get-assigned-topic`)
      .pipe(pluck('body'))
      .subscribe((res) => {
        if (res && res.length) {
          this.assignedTopics$.next(res);
        }
      });
  }

  getCurrentUser() {
    return this.apiService.getAPI(users, 'current-user').subscribe((res) => {
      if (res) {
        this.userInfo$.next(res);
        this.selectedUser.next(res);
      }
    });
  }

  checkUser() {
    if (!this.selectedUser.value.id) {
      this.apiService.getAPI(users, 'current-user').subscribe(
        (res) => {
          if (res && res.id) {
            this.selectedUser.next(res);
          }
        },
        () => {}
      );
    }
  }

  public isDeleteUser() {
    return this.isDeleteUser$.asObservable();
  }

  public setIsDeleteUser(value: boolean) {
    return this.isDeleteUser$.next(value);
  }
  public isDeletePhoneNumber() {
    return this.isDeletePhoneNumber$.asObservable();
  }

  public setIsDeletePhoneNumber(value: boolean) {
    return this.isDeletePhoneNumber$.next(value);
  }

  countUserByType(list = []): CountUser {
    let countUser: CountUser = {
      Landlord: 0,
      Tenant: 0,
      PropManager: 0,
      Supplier: 0
    };
    list.forEach((item) => {
      if (item.checked) {
        switch (item.type) {
          case EUserPropertyType.TENANT:
            countUser.Tenant++;
            break;
          case EUserPropertyType.LANDLORD:
            countUser.Landlord++;
            break;
          case EUserPropertyType.AGENT:
          case EUserPropertyType.PROPERTY_MANAGER:
            countUser.PropManager++;
            break;
          case EUserPropertyType.SUPPLIER:
            countUser.Supplier++;
            break;
          default:
            break;
        }
      }
    });
    return countUser;
  }

  setAgentAvatar(avatar) {
    this.selectedUserAvatar.next(avatar);
  }

  setFilesList(files: AgentFileProp[]): void {
    this.filesList.next(files);
  }

  checkAppUser(value: Email) {
    if (
      value?.userPropertyType === EUserPropertyType.TENANT ||
      value?.userPropertyType === EUserPropertyType.LANDLORD ||
      value?.userPropertyType === EUserPropertyType.TENANT_UNIT ||
      value?.userPropertyType === EUserPropertyType.TENANT_PROPERTY
    ) {
      return (
        this.getStatusInvite(
          value.inviteSent,
          value.lastActivity,
          value.offBoardedDate,
          value.trudiUserId
        ) === EUserInviteStatusType.active
      );
    }
    return false;
  }

  getStatusInvite(
    inviteSent: string | null,
    lastActivity: string | null,
    offBoardedDate?: string | null,
    trudiUserId?: string | null
  ): EUserInviteStatusType {
    if (offBoardedDate) {
      return EUserInviteStatusType.offboarded;
    }
    if (!inviteSent) {
      return EUserInviteStatusType.uninvited;
    }
    if (trudiUserId) {
      return EUserInviteStatusType.active;
    }
    if (inviteSent.length && !lastActivity) {
      return EUserInviteStatusType.pending;
    }
    if (inviteSent.length && lastActivity.length) {
      return EUserInviteStatusType.active;
    }
    return EUserInviteStatusType.active;
  }

  getAdministratorInfo() {
    return this.apiService.getAPI(users, 'administrator');
  }

  checkConsoleUserRole(userRole: string): boolean {
    return consoleUserRole.some((role) => role === userRole);
  }

  checkUserOffboardedOrUninviteOrPending(inviteStatus: string): boolean {
    return (
      inviteStatus.toLowerCase() === 'offboarded' ||
      inviteStatus.toLowerCase() === 'uninvite' ||
      inviteStatus.toLowerCase() === 'pending'
    );
  }

  sendVerifiedChangeEmail(userId: string) {
    return this.apiService.getAPI(
      users,
      `send-verification-change-email?userId=${userId}`
    );
  }

  getListSupplier(
    search = '',
    pageIndex = '',
    pageSize = '',
    onlyDataSyncPT = false,
    crmStatus: string = '',
    emailNull: boolean = false,
    userIds?: string[],
    agencyIds?: string[]
  ) {
    return this.apiService.postAPI(users, 'suppliers', {
      search,
      userIds,
      crmStatus,
      size: pageSize,
      onlyDataSyncPT,
      page: pageIndex,
      email_null: emailNull,
      agencyIds
    });
  }

  getListSuppliers(
    input: IInputToGetSupplier
  ): Observable<IUsersSupplierBasicInfoProperty | ISupplierBasicInfo[]> {
    return this.apiService.postAPI(users, 'v2/suppliers', input);
  }

  deleteSupplier(body: { supplierDeleteIds: string[]; userId: string }) {
    return this.apiService.deleteAPI(users, 'delete/suppliers', body);
  }

  getListTrudiContact(
    search = '',
    email = '',
    page?: number,
    limit?: number,
    phoneNumber?: string,
    propertyId?: string,
    emailIgnores?: string[],
    phoneNumberIgnore?: string
  ): Observable<ResponseTrudiContact> {
    email = encodeURIComponent(email);
    let params = `search=${search}&email=${email}`;
    if (page && limit) params += `&page=${page}&limit=${limit}`;
    if (phoneNumber) params += `&phoneNumber=${phoneNumber}`;
    if (propertyId) params += `&propertyId=${propertyId}`;
    if (emailIgnores && emailIgnores.length > 0) {
      emailIgnores.forEach((email) => {
        params += `&emailIgnores[]=${encodeURIComponent(email)}`;
      });
    }
    if (phoneNumberIgnore) {
      params += `&phoneNumberIgnore=${phoneNumberIgnore}`;
    }

    return this.apiService.getAPI(users, `get-list-contact?${params}`);
  }

  getListTrudiProperties(search = ''): Observable<PropertyContact[]> {
    return this.apiService.getAPI(
      properties,
      `get-list-properties?search=${search}`
    );
  }

  createNewContact(
    email: string,
    phoneNumber: string,
    lastName: string,
    type: string,
    contactType: string,
    agencyId: string,
    channelUserId?: string
  ) {
    return this.apiService.postAPI(users, 'create-new-contact', {
      email,
      phoneNumber,
      lastName,
      type,
      contactType,
      agencyId,
      channelUserId
    });
  }

  createSupplierList(list: Suppliers[]): SupplierItemDropdown[] {
    const supplierList = [];
    list.forEach((item) => {
      supplierList.push({
        label: item.lastName,
        value: { name: item.lastName, email: item.email, topicId: item.id },
        group: 'suppliers'
      });
    });
    return supplierList;
  }

  getUsersEmailNotification(): Observable<NotificationSettingApiResponse> {
    return this.apiService.getAPI(users, `pm/email-notification-setting`);
  }

  updateEmailNotificationSetting(data: NotificationSettingApiResponse) {
    return this.apiService.putAPI(users, `pm/email-notification-setting`, data);
  }

  getSearchByEmail(searchQuery: string) {
    return this.apiService.getAPI(
      users,
      `search-by-email?email=${searchQuery}`
    );
  }

  deleteSecondaryEmail(emailId: string) {
    return this.apiService.deleteAPI(
      users,
      `delete-secondary-email?id=${emailId}`
    );
  }

  deleteSecondaryPhone(phoneId: string) {
    return this.apiService.deleteAPI(
      users,
      `delete-secondary-phone?id=${phoneId}`
    );
  }

  checkPmPortalIsDeleted() {
    const info = this.userInfo$.getValue();
    if (info) {
      // Remove the condition that the user is deleted from PM
      // this.pmPortalIsDeleted = info.type === EUserPropertyType.LEAD && (info.status === 'DELETED' || info.status === 'ARCHIVED');
    } else {
      this.pmPortalIsDeleted = true;
    }
  }

  checkSecondEmailInOpenConversation(emailId: string) {
    return this.apiService.getAPI(
      users,
      `check-second-email-in-open-conversation?id=${emailId}`
    );
  }

  updateFavouriteSupplier(
    idUserSupplier: string,
    isFavourite: boolean
  ): Observable<{ message: string }> {
    return this.apiService.postAPI(
      users,
      'suppliers/update-favorite-suppliers',
      { idUserSupplier, isFavourite }
    );
  }

  addSecondaryEmailToContact(
    userId: string,
    email: string,
    propertyId: string,
    channelUserId?: string,
    taskId?: string
  ): Observable<SecondaryEmail> {
    return this.apiService.postAPI(users, 'add-secondary-email', {
      userId,
      email,
      propertyId,
      channelUserId,
      taskId
    });
  }

  addSecondaryPhoneToContact(
    userId: string,
    phoneNumber: string,
    propertyId: string,
    channelUserId?: string
  ): Observable<SecondaryEmail> {
    return this.apiService.postAPI(users, 'add-secondary-phone', {
      userId,
      phoneNumber,
      propertyId,
      channelUserId
    });
  }

  formatOtherContactsConversation(
    contacts: OtherContact[]
  ): OtherContactDropdown[] {
    return contacts.map((contact) => ({
      id: contact.id,
      label: contact.sendFrom,
      value: {
        id: contact.id,
        name: contact.sendFrom,
        email: contact.email,
        contactType: contact.contactType.replace('_', ' '),
        type: contact.type,
        typeLabel: 'Other Contacts'
      },
      group: contact.contactType
    }));
  }

  getListContactByEmail(email: string) {
    return this.getListTrudiContact('', email).pipe(
      takeUntil(this.subscribers),
      map((res) => {
        const listProperty = res.contacts.reduce((list, contact) => {
          const checkUserType = ![
            EConfirmContactType.SUPPLIER,
            EConfirmContactType.OTHER
          ].includes(contact.userType as EConfirmContactType);

          if (
            checkUserType &&
            !list.some((property) => property?.id === contact?.property?.id)
          ) {
            list.push(contact?.property);
          }
          return list;
        }, []);
        return listProperty;
      })
    );
  }

  ngOnDestroy() {
    this.subscribers.next();
    this.subscribers.complete();
  }

  checkUserInviteStatus(params) {
    return this.apiService.getAPI(
      users,
      `get-user-invite-status?userId=${params}`
    );
  }

  sendBulkAppInvite(body) {
    return this.apiService.postAPI(users, 'send-bulk-app-invite', body);
  }

  checkIsAgencyAdmin(
    companyId: string,
    companyAgents: CompanyAgentCurrentUser[]
  ) {
    if (!companyId || !companyAgents) return false;
    return companyAgents.find(
      (companyAgent) => companyAgent.companyId === companyId
    ).isAgencyAdmin;
  }

  async checkIsPortalUser() {
    if (!this.userInfo$?.value?.type) await this.getUserInfo();
    return this.userInfo$?.value?.type === UserTypeEnum.LEAD;
  }

  getListUser(
    body: {
      propertyId: string;
      search: string;
      email_null?: boolean;
    },
    taskId: string = null
  ): Observable<ISelectedReceivers[]> {
    if (!taskId) return this.apiService.postAPI(users, 'get-list-user', body);
    if (
      taskId === this.listUserCache.taskId &&
      this.listUserCache.data?.length > 0
    ) {
      return of(this.listUserCache.data);
    }
    return this.apiService.postAPI(users, 'get-list-user', body).pipe(
      tap((data) => {
        this.listUserCache = {
          taskId,
          data
        };
      })
    );
  }

  get agencyIdFromLocalStorage() {
    return this._localStorageService.getValue('agencyId') || null;
  }

  addEventToCalendar(userCalendarSettingId: string, body: { config: IEvents }) {
    return this.apiService.postAPI(
      conversations,
      `calendar/update-setting/${userCalendarSettingId}`,
      body
    );
  }

  getListOfAgent(
    search: string,
    filterRole: string,
    filterPod: string
  ): Observable<Agent[]> {
    return this.apiService.getAPI(
      users,
      `v2/list-of-agent?role=${filterRole}&search=${search}&pod=${filterPod}`
    );
  }

  notifyLaterApi() {
    return this.apiService.getAPI(users, 'disable-version-update-request');
  }
}
