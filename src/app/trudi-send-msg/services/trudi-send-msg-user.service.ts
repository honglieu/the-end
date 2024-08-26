import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap
} from 'rxjs';
import { ApiService } from '@services/api.service';
import { conversations, users } from 'src/environments/environment';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { EUserInviteStatusType } from '@shared/enum/userType.enum';
import { EUserPlatformType, EUserPropertyType } from '@shared/enum/user.enum';
import { UserService } from '@services/user.service';

@Injectable()
export class TrudiSendMsgUserService {
  constructor(
    private apiService: ApiService,
    private userService: UserService
  ) {}

  private getListUserPayloadBS = new BehaviorSubject<GetListUserPayload>(null);
  private currentPage = 1;
  public totalPage;
  public totalUser: number = null;
  public useUserProperties: boolean = false;
  private isLoadingBS = new BehaviorSubject(false);
  public isLoading$ = this.isLoadingBS.asObservable();

  getListUser() {
    return this.getListUserPayloadBS.pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((rs) => {
        this.isLoadingBS.next(true);
        if (rs) return this.getListUserApi(rs);
        return of(null);
      }),
      map((rs: GetListUserResponse | null) => {
        if (rs) {
          this.isLoadingBS.next(false);
          this.currentPage = rs.currentPage;
          this.totalPage = rs.totalPage;
          if (!this.totalUser) this.totalUser = rs.totalUser;
          return this.useUserProperties ? rs.userProperties : rs.users;
        }
        return [];
      }),
      map((filteredTenancyList: ISelectedReceivers[]): ISelectedReceivers[] => {
        if (filteredTenancyList) {
          return this.updateUserProperties(filteredTenancyList);
        }
        return filteredTenancyList;
      })
    );
  }

  getListUserV2(rs: GetListUserPayload) {
    return this.getListUserApi(rs).pipe(
      switchMap((response) => {
        const rs = response as GetListUserResponse;
        if (rs.users) {
          this.updateUserProperties(rs.users);
        }
        if (rs.userProperties) {
          this.updateUserProperties(rs.userProperties);
        }
        return of(rs);
      })
    );
  }

  public updateUserProperties(receiverData) {
    return receiverData.map((item) => {
      if (
        item?.type === EUserPropertyType.TENANT ||
        item?.type === EUserPropertyType.LANDLORD ||
        item?.type === EUserPropertyType.TENANT_UNIT ||
        item?.type === EUserPropertyType.TENANT_PROPERTY
      ) {
        item.isAppUser =
          this.userService.getStatusInvite(
            item?.iviteSent,
            item?.lastActivity,
            item?.offBoardedDate,
            item?.trudiUserId
          ) === EUserInviteStatusType.active;
      }
      item.disabled = item?.disabled;
      return item;
    });
  }

  getListUserNotFilterEmail(propertyId, agencyId, userDetails) {
    if (!propertyId || !agencyId) return of([]);
    return this.getListUserApi({
      limit: userDetails?.length > 20 ? userDetails?.length : 20,
      page: 1,
      search: '',
      propertyId: propertyId,
      email_null: true,
      userDetails
    }).pipe(
      map((rs) => {
        if (rs) {
          return (rs as GetListUserResponse).users;
        }
        return [];
      }),
      map((filteredTenancyList: ISelectedReceivers[]): ISelectedReceivers[] => {
        filteredTenancyList.forEach((item) => {
          if (
            item?.type === EUserPropertyType.TENANT ||
            item?.type === EUserPropertyType.LANDLORD
          ) {
            item.isAppUser =
              this.userService.getStatusInvite(
                item?.iviteSent,
                item?.lastActivity,
                item?.offBoardedDate,
                item?.trudiUserId
              ) === EUserInviteStatusType.active;
          }
          item.disabled = item?.disabled;
        });
        return filteredTenancyList;
      })
    );
  }

  fetchMore(body: Partial<GetListUserPayload>) {
    this.getListUserPayloadBS.next({
      ...this.getListUserPayloadBS.value,
      ...body
    });
  }

  getNextPage() {
    this.fetchMore({
      page: this.currentPage + 1
    });
  }

  getCurrentPage() {
    return this.currentPage;
  }

  getListUserApi(
    body: GetListUserPayload
  ): Observable<GetListUserResponse | ISelectedReceivers[]> {
    return this.apiService.postAPI(users, 'get-list-user', body);
  }

  getListContactTypeApi(
    body: IGetListContactTypePayload
  ): Observable<IGetListContactTypeResponse[]> {
    return this.apiService.postAPI(users, 'get-list-contact-type', body);
  }

  getDynamicFieldsDataMessageScratchApi(
    body: IGetDynamicFieldsDataMessageScratchPayload
  ) {
    return this.apiService.postAPI(
      conversations,
      'get-dynamic-fields-data-message-scratch',
      body
    );
  }

  public get lastPage() {
    return this.currentPage === this.totalPage;
  }
}

export interface GetListUserPayload {
  propertyId: string;
  search: string;
  onlySyncData?: boolean;
  page?: number;
  limit?: number;
  size?: number;
  type?: EUserPropertyType;
  types?: EUserPropertyType[];
  userDetails?: PrefillUser[];
  email_null?: boolean;
  taskIds?: string[];
  isReplyMsg?: boolean;
  isShowArchivedStatus?: boolean;
  ignoreUserDetails?: PrefillUser[];
  userPlatformType?: EUserPlatformType;
  filterAll?: boolean;
  isContactCard?: boolean;
  isOnlySupplierAndOther?: boolean;
}

export interface GetListUserResponse {
  currentPage?: number;
  totalPage?: number;
  totalUser?: number;
  users?: ISelectedReceivers[];
  userProperties?: ISelectedReceivers[];
}

export interface PrefillUser {
  id: string;
  propertyId?: string;
}

export interface IGetListContactTypePayload {
  taskIds: string[];
}

export interface IGetListContactTypeResponse {
  id?: number | string;
  type: string;
  label?: string;
  subLabel?: string;
  disabled?: boolean;
  data: ISelectedReceivers[];
}

export interface IGetDynamicFieldsDataMessageScratchPayload {
  propertyId?: string;
  userProperties?: IUserProperties[];
}

export interface IUserProperties {
  userId: string;
  propertyId: string;
}
