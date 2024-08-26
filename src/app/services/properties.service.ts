import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, lastValueFrom, of } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  map,
  takeUntil,
  tap
} from 'rxjs/operators';
import { conversations, properties } from 'src/environments/environment';
import { IDocuments } from '@/app/invoicing/tenancy-invoicing/utils/invoiceTypes';
import { TaskType } from '@shared/enum/task.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import {
  IPropertyNotePayload,
  Property,
  TypeChangeTaskPropertyPayload,
  TypeConversationPropertyPayload,
  listPropertyNoteInterface
} from '@shared/types/property.interface';
import { Regions } from '@shared/types/trudi.interface';
import { IPersonalInTab, PropertyManager } from '@shared/types/user.interface';
import { AgencyService } from './agency.service';
import { ApiStatusService, EApiNames } from './api-status.service';
import { ApiService } from './api.service';
import { UserService } from './user.service';
import { CompanyService } from './company.service';

export enum popType {
  verified = 'VERIFIED',
  pending = 'PENDING'
}

@Injectable({
  providedIn: 'root'
})
export class PropertiesService {
  public propTypes = popType;
  public selectedPropertyId;

  private getPropertiesInterval: NodeJS.Timer | null = null;
  private currentPropSearch = '';
  private agencyId = null;
  public currentPropertyId: BehaviorSubject<string> =
    new BehaviorSubject<string>('');
  public currentProperty: BehaviorSubject<any> = new BehaviorSubject('');
  public newCurrentProperty: BehaviorSubject<Property> = new BehaviorSubject(
    null
  );
  public listofActiveProp: BehaviorSubject<Array<any>> = new BehaviorSubject(
    null
  );
  public listPropertyActiveStatus: BehaviorSubject<Array<any>> =
    new BehaviorSubject(null);
  public listPropertyAllStatus: BehaviorSubject<Array<any>> =
    new BehaviorSubject(null);
  public currentPropTab: BehaviorSubject<any> = new BehaviorSubject(
    this.propTypes.verified
  );
  public propertyAddressToSearch: BehaviorSubject<string> =
    new BehaviorSubject<string>('');
  public currentFileStatusList: BehaviorSubject<any> = new BehaviorSubject({});
  public selectedId = new BehaviorSubject(null);
  public propertyNotes: BehaviorSubject<Array<any>> = new BehaviorSubject([]);

  public usersInSelectedProperty = new BehaviorSubject<any>(null);
  public peopleList = new BehaviorSubject<IPersonalInTab>(null);
  private peopleListInSelectPeople = new BehaviorSubject<IPersonalInTab>(null);
  public peopleList$ = this.peopleList.asObservable();
  public peopleListInSelectPeople$ =
    this.peopleListInSelectPeople.asObservable();
  public expenditureLimit: string;
  private unsubscribe = new Subject<void>();
  public currentTaskRegion: BehaviorSubject<Regions> = new BehaviorSubject(
    null
  );
  constructor(
    private apiService: ApiService,
    private userService: UserService,
    private agencyService: AgencyService,
    private apiStatusService: ApiStatusService,
    private companyService: CompanyService
  ) {}

  destroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.unsubscribe = new Subject<void>();
  }

  init() {
    this.destroy();
    this.userService.checkUser();
    this.userService.selectedUser
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res && res.id) {
          this.agencyService.loadAgencies();
        }
      });
    // this.route.firstChild.params.subscribe(params => {
    //   this.selectedPropertyId = params['propertyId'];
    //
    //   this.agencyService.changeAgency(params['agencyId']);
    //   console.log('getPRopDetail', this.selectedPropertyId)
    this.getPropDetail(this.selectedPropertyId);
    // });
    this.currentPropertyId
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((id) => {
        if (id) {
          this.apiService
            .getAPI(properties, 'property-by-id/' + id)
            .subscribe((result) => {
              if (result) {
                this.newCurrentProperty.next(result);
                this.getPeople(result.id);
                this.expenditureLimit = result.expenditureLimit;
              }
            });
        }
      });

    this.companyService
      .getCurrentCompanyId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (rs) {
          const userInfo = this.userService.userInfo$.getValue();
          this.getProperties(rs);
        }
      });
    return;
  }

  getPropertyById(id: string) {
    return this.apiService.getAPI(properties, 'property-by-id/' + id);
  }
  getListTenancyByProperty(isCRM, data) {
    return this.apiService.postAPI(
      properties,
      (!isCRM ? 'pt' : 'rm') + '-list-tenancy-by-property',
      data
    );
  }
  getListOwnershipByProperty(isCRM, data) {
    return !isCRM
      ? this.apiService.getAPI(
          properties,
          `pt-list-ownership-by-property/${data.propertyId}`
        )
      : this.apiService.postAPI(
          properties,
          'rm-list-ownership-by-property/',
          data
        );
  }
  getPeople(propertyId?: string): void {
    if (!propertyId) {
      this.peopleList.next(null);
      return;
    }
    this.apiService
      .getData<IPersonalInTab>(
        `${properties}list-of-userProperty/${propertyId}`
      )
      .pipe(
        map((response) => response.body),
        catchError(() => of<IPersonalInTab>())
      )
      .subscribe((res) => {
        if (res) {
          res.ownerships.forEach((data) =>
            data.userProperties.sort((a, b) => {
              return a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1;
            })
          );
          res.tenancies.forEach((data) =>
            data.userProperties.sort((a, b) => {
              return a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1;
            })
          );
          res.tenancies = this.sortTenanciesAndOwnerships(res.tenancies);
          res.ownerships = this.sortTenanciesAndOwnerships(res.ownerships);
          this.peopleList.next(res);
        }
      });
  }
  sortTenanciesAndOwnerships(list) {
    return list.sort((a, b) => {
      const sameStatus = a.status === b.status;
      return sameStatus ? a.name.localeCompare(b.name) : 0;
    });
  }

  getPeopleInSelectPeople(propertyId?: string): void {
    if (!propertyId) return;
    this.apiService
      .getData<IPersonalInTab>(
        `${properties}list-of-userProperty/${propertyId}`
      )
      .pipe(
        map((response) => response.body),
        catchError(() => of<IPersonalInTab>())
      )
      .subscribe((res) => {
        if (res) {
          res.ownerships.forEach((data) =>
            data.userProperties.sort((a, b) => {
              return a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1;
            })
          );
          res.tenancies.forEach((data) =>
            data.userProperties.sort((a, b) => {
              return a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1;
            })
          );
          res.tenancies = this.sortTenanciesAndOwnerships(res.tenancies);
          res.ownerships = this.sortTenanciesAndOwnerships(res.ownerships);
          this.peopleListInSelectPeople.next(res);
        }
      });
  }

  getListUserOfRM(propertyId: string) {
    return this.apiService.getAPI(
      properties,
      `list-of-source-property/${propertyId}`
    );
  }

  async getTenancyStatus(
    propertyId?: string,
    tenancyId?: string
  ): Promise<string | null> {
    const data = await lastValueFrom(
      this.apiService.getData<IPersonalInTab>(
        `${properties}list-of-userProperty/${propertyId}`
      )
    );
    const tenancy = data.body.tenancies.find(
      (tenancy) => tenancy.id === tenancyId
    );
    return tenancy ? tenancy.status : null;
  }

  getPropertyManagers() {
    return this.apiService.getAPI(properties, `get-property-managers`);
  }

  getUsersInSelectedProperty() {
    return this.usersInSelectedProperty.asObservable();
  }

  setUsersInSelectedProperty(users) {
    this.usersInSelectedProperty.next(users);
  }

  getLeaseSummary(userPropertyId, leaseId?: string) {
    return this.apiService.getAPI(
      properties,
      'lease-summary?propertyId=' +
        userPropertyId +
        (leaseId ? `&&leaseId=${leaseId}` : '')
    );
  }

  getPropDetail(propId) {
    if (!propId) {
      this.newCurrentProperty.next(null);
      this.currentFileStatusList.next([]);
      return;
    }
    this.apiService
      .getAPI(properties, 'property-by-id/' + propId)
      .subscribe((result) => {
        if (result) {
          this.newCurrentProperty.next(result);
          this.getPeople(result.id);
          this.expenditureLimit = result.expenditureLimit;
        }
      });
  }

  public getPropertyBySaveToPt(isAddArchived) {
    return this.apiService.getAPI(
      properties,
      `v2/agency-properties?isAddArchived=${isAddArchived}`
    );
  }

  public getProperties(companyId: string, changeStatusApi: boolean = true) {
    if (!companyId) {
      this.listofActiveProp.next([]);
      return;
    }

    changeStatusApi &&
      this.apiStatusService.setApiStatus(EApiNames.GetAgencyProperties, false);
    this.apiService
      .getAPI(properties, 'v2/agency-properties')
      .subscribe((data) => {
        this.apiStatusService.setApiStatus(EApiNames.GetAgencyProperties, true);
        const sortedProp = this.sortPropertiesByLastMessageDate(data);
        this.listPropertyActiveStatus.next(data);
        this.listofActiveProp.next(sortedProp);
      });
  }

  public getPropertiesAllStatus(companyId: string) {
    if (!companyId) {
      this.listPropertyAllStatus.next([]);
      return;
    }

    this.apiService
      .postAPI(properties, 'get-list-property-all-status-by-agencyId', {})
      .subscribe((data) => {
        this.listPropertyAllStatus.next(data);
      });
  }

  public getPropertiesSuggestedAllStatus(emails: string[] = []) {
    return this.apiService.postAPI(
      properties,
      'get-list-property-all-status-by-agencyId',
      {
        emails
      }
    );
  }

  getPropertyNote(propertyId: string): Observable<listPropertyNoteInterface[]> {
    return this.apiService
      .getAPI(properties, `notes/${propertyId}`)
      .pipe<listPropertyNoteInterface[]>(tap((response: any) => response));
  }

  createPropertyNote(payload: IPropertyNotePayload) {
    return this.apiService.postAPI(properties, 'note/create', payload);
  }

  updatePropertyNote(payload: IPropertyNotePayload) {
    return this.apiService.putAPI(properties, 'note/update', payload);
  }

  getListPropertyNote(propertyId: string) {
    return this.apiService.getAPI(properties, `note/list/${propertyId}`);
  }

  cancelPropertyNote(noteId: string) {
    return this.apiService.postAPI(properties, `note/cancel/${noteId}`, {});
  }

  removePropertyNote(noteId: string) {
    return this.apiService.deleteAPI(properties, `note/delete/${noteId}`);
  }

  updateConversationProperty(body: TypeConversationPropertyPayload) {
    return this.apiService.putAPI(
      conversations,
      'reassign-conversation-property',
      body
    );
  }

  updateTaskProperty(body: TypeChangeTaskPropertyPayload) {
    return this.apiService.putAPI(
      conversations,
      'reassign-task-property',
      body
    );
  }

  public getCategoryNoteRM() {
    return this.apiService.getAPI(conversations, `get-note-categories`);
  }

  public getAgencyProperty(userId, propertyId) {
    return this.apiService
      .getAPI(
        properties,
        'v2/agency-properties?keyword=' +
          '&userId=' +
          userId +
          '&propertyId=' +
          propertyId
      )
      .pipe(map((data) => this.sortPropertiesByLastMessageDate(data || [])));
  }

  public updateProperty() {
    this.apiService
      .getAPI(properties, 'agency-properties?keyword=' + this.currentPropSearch)
      .subscribe((data) => {
        const sortedProp = this.sortPropertiesByLastMessageDate(data);
        this.listofActiveProp.next(sortedProp);
      });
  }

  public updatePropertyCheckedList(currentList) {
    const obj = {
      propertyId: this.currentProperty.value.id,
      ...currentList
    };
    this.apiService
      .putAPI(properties, 'update-propertyCheckList', obj)
      .subscribe(
        () => {},
        () => {}
      );
  }

  public activateProperty() {
    const obj = {
      propertyId: this.currentProperty.value.id
    };
    this.apiService.putAPI(properties, 'activate-property', obj).subscribe(
      () => {
        this.changeTab(popType.verified);
      },
      () => {}
    );
  }

  public sortPropertiesByLastMessageDate(propertiesList) {
    const list = propertiesList.sort((a, b) => {
      return +new Date(b.updatedAt) - +new Date(a.updatedAt);
    });
    return list;
  }

  setSearch(search: string) {
    this.currentPropSearch = search;
    this.beginSearch(1500);
  }

  changeTab(tab: popType) {
    this.currentPropTab.next(tab);
    this.updateProperty();
  }

  public beginSearch(timer: number): void {
    this.endSearch();
    this.getPropertiesInterval = setTimeout(() => {
      this.updateProperty();
      this.getPropertiesInterval = null;
    }, timer);
  }

  public endSearch() {
    if (!this.getPropertiesInterval) {
      return;
    }
    clearTimeout(this.getPropertiesInterval);
    this.getPropertiesInterval = null;
  }

  addFile2(
    propertyId: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    mediaLink,
    userPropertyIds,
    documentTypeId: string,
    title: string
  ) {
    return this.apiService.postAPI(properties, 'add-property-document', {
      mediaLink,
      fileName,
      fileSize,
      fileType,
      propertyId,
      documentTypeId,
      userPropertyIds,
      title
    });
  }

  openFile(document: any) {
    window.open(document.mediaLink, '_blank');
  }

  public addPrimaryUsersByProperyId(propertyId: string) {
    return this.apiService.postAPI(
      properties,
      'add-update-property-onboarding-stepper',
      {
        propertyId,
        emptyState: true
      }
    );
  }

  public getPrimaryUserByProperyId(propertyId: string) {
    return this.apiService.getAPI(
      properties,
      `property-onboarding-stepper/${propertyId}`
    );
  }

  getSelectedID() {
    return this.selectedId.asObservable();
  }

  setSelectedID(id: string) {
    this.selectedId.next(id);
  }

  getUserInformation(userId: string) {
    return this.apiService.getAPI(
      properties,
      `user-properties?userId=${userId}`
    );
  }

  getMaintenanceNotes(propertyId: string) {
    return this.apiService.getAPI(properties, `property-by-id/${propertyId}`);
  }

  getTenancyList() {
    return this.peopleList$.pipe(
      map((peoples) => {
        if (peoples && Array.isArray(peoples.tenancies)) {
          return peoples.tenancies.reduce((acc, curr) => {
            if (curr && Array.isArray(curr.userProperties)) {
              curr.userProperties.forEach((it) => acc.push(it));
            }
            return acc;
          }, []);
        } else {
          return of([]);
        }
      })
    );
  }

  getTooltipPropertyStatus(property) {
    const { propertyStatus, type } = property || {};
    const propertyType =
      !type || ['Property', 'UNIDENTIFIED'].includes(type)
        ? 'property'
        : 'unit';
    const statusMessages = {
      INACTIVE: `Inactive ${propertyType}`,
      ARCHIVED: `Archived ${propertyType}`,
      DELETED: `Deleted ${propertyType}`
    };
    return statusMessages[propertyStatus] || '';
  }

  getAddressProperty(
    property: Partial<Property>,
    propertyType: string,
    type?: string
  ): string {
    if (
      (propertyType === EUserPropertyType.SUPPLIER ||
        propertyType === EUserPropertyType.OTHER ||
        propertyType === EUserPropertyType.LANDLORD_PROSPECT ||
        propertyType === EUserPropertyType.TENANT_PROSPECT ||
        propertyType === EUserPropertyType.OWNER_PROSPECT) &&
      type === TaskType.MESSAGE
    ) {
      return 'No property';
    }
    if (!property.streetline) {
      if (
        propertyType === EUserPropertyType.OWNER ||
        propertyType === EUserPropertyType.LANDLORD
      ) {
        return 'No property';
      }
    }
    return property.streetline;
  }

  detectDataInvoice(fileUrl: string): Observable<IDocuments> {
    return this.apiService.postAPI(properties, `detect-invoice`, { fileUrl });
  }

  get agencyIdFromLocalStorage() {
    return localStorage.getItem('agencyId') || null;
  }

  getPropertyManagerContacts(
    propertyId: string
  ): Observable<PropertyManager[]> {
    return this.apiService.getAPI(
      properties,
      `/${propertyId}/propertyManagers/contacts`
    );
  }
}
