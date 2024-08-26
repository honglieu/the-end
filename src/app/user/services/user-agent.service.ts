import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { IAgency } from '@shared/types/users-by-property.interface';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { IDropdownMenuItem } from '@/app/user/shared/components/dropdown-menu-contacts/dropdown-menu-contacts.component';
import { ITriggerEventFilter } from '@/app/user/utils/user.type';
import { listPropertyNoteInterface } from '@shared/types/property.interface';
import {
  ETypeContactItem,
  IContactItemFormatted,
  IUserProperties,
  USER_PROPERTY_TYPE
} from '@/app/user/list-property-contact-view/model/main';
import { FrequencyRental } from '@shared/types/trudi.interface';
import uuid4 from 'uuid4';
@Injectable({
  providedIn: 'root'
})
export class UserAgentService implements OnDestroy {
  constructor(private agencyDashboardService: AgencyDashboardService) {}
  public isExpandPopupPT$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public isCompletedScroll$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  private crmLandlordProspectOption$: BehaviorSubject<string[]> =
    new BehaviorSubject<string[]>([]);
  private crmTenantProspectOption$: BehaviorSubject<string[]> =
    new BehaviorSubject<string[]>(null);
  public resetCollection$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  private triggerFilter$: BehaviorSubject<ITriggerEventFilter> =
    new BehaviorSubject({ isTrigger: false, pageSize: 0, pageIndex: 0 });

  private listNoteOfUser$: BehaviorSubject<listPropertyNoteInterface[]> =
    new BehaviorSubject<listPropertyNoteInterface[]>([]);

  private unsubscribe = new Subject<void>();
  private listSelected$: BehaviorSubject<
    IContactItemFormatted<IUserProperties>[]
  > = new BehaviorSubject<IContactItemFormatted<IUserProperties>[]>([]);

  get getListSelected$() {
    return this.listSelected$.asObservable();
  }
  set setListSelected$(listSelected: IContactItemFormatted<IUserProperties>[]) {
    this.listSelected$.next(listSelected);
  }
  get getListNoteOfUser$() {
    return this.listNoteOfUser$.asObservable();
  }

  get getListNoteOfUser() {
    return this.listNoteOfUser$.value;
  }
  setListNoteOfUser(value: listPropertyNoteInterface[]) {
    return this.listNoteOfUser$.next(value);
  }
  set setTriggerActionFilter(filterObject: ITriggerEventFilter) {
    this.triggerFilter$.next(filterObject);
  }

  get getTriggerValueActionFilter(): Observable<ITriggerEventFilter> {
    return this.triggerFilter$.asObservable();
  }

  set setcrmLandlordProspectOption(value) {
    this.crmLandlordProspectOption$.next(value);
  }

  get getcrmLandlordProspectOption() {
    return this.crmLandlordProspectOption$.asObservable();
  }

  set setCRMTenantProspectOption(value) {
    this.crmTenantProspectOption$.next(value);
  }

  get getCRMTenantProspectOption() {
    return this.crmTenantProspectOption$.asObservable();
  }

  handleFormatDataListUser(listAgenciesProperty: IAgency[]) {
    if (!listAgenciesProperty) {
      return (listAgenciesProperty = []);
    }
    return listAgenciesProperty.map((item) => {
      const dependencies = item.userProperties.map((userProperty, index) => {
        const isFirstChild = index === 0;
        const isLastItem = index === item.userProperties.length - 1;
        const propertyDetail = isFirstChild
          ? {
              streetline: item.streetline || '',
              propertyName: item.sourceProperty?.propertyName || '',
              propertyId: item.propertyId || '',
              statusProperty: item.status || '',
              isFirstProperty: isFirstChild
            }
          : {};

        return {
          uuid: uuid4(),
          isChecked: false,
          propertyDetail,
          role: userProperty.type,
          status: userProperty.status || userProperty.source?.crmStatus || '',
          email: userProperty.email || '',
          propertyId: userProperty.propertyId || '',
          userPropertyId: userProperty.userPropertyId || userProperty.id || '',
          userId: userProperty.userId || '',
          unconfirmedChangeEmail: userProperty.unconfirmedChangeEmail || '',
          firstName: userProperty.firstName || '',
          lastName: userProperty.lastName || '',
          inviteSent: userProperty.iviteSent || '',
          lastActivity: userProperty.lastActivity || '',
          inviteStatus: userProperty.inviteStatus || '',
          phoneNumbers:
            userProperty.phoneNumbers || userProperty.mobileNumber || [],
          secondaryPhones: userProperty.secondaryPhones || [],
          secondaryEmails: userProperty.secondaryEmails || [],
          numUnit: userProperty?.source?.['numUnit'] || '',
          isLastItem,
          propertyManager: item?.propertyManager,
          displayStatus: userProperty.displayStatus || '',
          userMessengers: userProperty.userMessengers || [],
          userWhatsApps: userProperty.userWhatsApps || []
        };
      });

      return {
        id: uuid4(),
        propertyId: item.propertyId,
        streetline: item.streetline,
        propertyName: item.sourceProperty?.propertyName,
        dependencies
      };
    });
  }

  handleFormatListContact(dataArray) {
    let listSelected = [];
    this.getListSelected$.pipe(takeUntil(this.unsubscribe)).subscribe((res) => {
      listSelected = res;
    });
    return dataArray.reduce((formattedData, dataItem) => {
      // property and unit
      const propertyOrUnitData = {
        dataType:
          dataItem?.sourceProperty?.type === ETypeContactItem.PROPERTY
            ? ETypeContactItem.PROPERTY
            : ETypeContactItem.UNIT,
        data: {
          streetline: dataItem.streetline,
          status: dataItem.status,
          propertyId: dataItem.propertyId,
          displayAddress: dataItem.displayAddress,
          sourceProperty: dataItem.sourceProperty,
          propertyManager: dataItem.propertyManager,
          agencyId: dataItem.agencyId
        }
      };

      // property or unit
      formattedData.push(propertyOrUnitData);

      // userPropertyGroups
      dataItem?.userPropertyGroups?.forEach((group, groupIndex, groupArray) => {
        const isFirstGroup = groupIndex === 0;
        const isLastGroup = groupIndex === groupArray.length - 1;
        const groupType =
          group.type === USER_PROPERTY_TYPE.TENANCY
            ? ETypeContactItem.TENANT
            : ETypeContactItem.OWNER;
        const groupData = {
          dataType: groupType,
          data: {
            id: group.id,
            name: group.name,
            status: group.status,
            type: group.type,
            displayTitle: group.displayTitle,
            isFirstGroup: isFirstGroup,
            isLastGroup: isLastGroup
          }
        };

        formattedData.push(groupData);

        // userProperties
        const userPropsData = group.userProperties.map(
          (userProp, userIndex, userArray) => {
            const isFirstUser = userIndex === 0 && isFirstGroup;
            const isLastUser =
              userIndex === userArray.length - 1 && isLastGroup;

            return {
              dataType: 'Contact',
              isChecked: !!listSelected?.find((select) => {
                return select?.userPropertyId === userProp?.userPropertyId;
              }),
              data: {
                ...userProp,
                isFirst: isFirstUser,
                isLast: isLastUser,
                streetline: dataItem.streetline
              }
            };
          }
        );
        formattedData.push(...userPropsData);
      });

      return formattedData;
    }, []);
  }

  handleTextParamChange(items: IDropdownMenuItem[], bindLabel: string): string {
    const textArray = items.map((item) =>
      item[bindLabel] === 'PROSPECTIVE' ? 'PROSPECT' : item[bindLabel]
    );
    const resultCrmStatusParam = textArray.join(',');
    return resultCrmStatusParam || '';
  }

  combineToQueryStringParams(params) {
    return Object.entries(params)
      .map(
        ([key, value]) =>
          `${key}=${encodeURIComponent(
            (value as string | number | boolean) || ''
          )}`
      )
      .join('&');
  }

  public formatLeaseFequency(frequency) {
    switch (frequency) {
      case FrequencyRental.DAILY:
        return '/ day';
      case FrequencyRental.WEEKLY:
        return '/ week';
      case FrequencyRental.FORTNIGHT:
        return '/ fortnight';
      case FrequencyRental.MONTHLY:
        return '/ month';
      case FrequencyRental.QUARTERLY:
        return '/ quarter';
      case 'YEARLY':
        return '/ year';
      default:
        return '';
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
