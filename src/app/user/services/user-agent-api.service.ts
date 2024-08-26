import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { UserAgentService } from '@/app/user/services/user-agent.service';
import { properties, users } from 'src/environments/environment';
import queryString from 'query-string';
import { HttpParams } from '@angular/common/http';
import { EConversationType } from '@/app/shared/enum/conversationType.enum';

interface IDeleteUserRequest {
  ids: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserAgentApiService {
  constructor(
    private apiService: ApiService,
    private userAgentService: UserAgentService
  ) {}

  onDeleteUserAgent(payloadBody: IDeleteUserRequest) {
    return this.apiService.deleteByPost(`${users}/delete-users`, payloadBody);
  }

  getOwnerProspect(
    page?: number,
    size?: number,
    crmStatus?: string[],
    searchText?: string
  ) {
    return this.apiService.getAPI(
      properties,
      `owner-prospect?page=${page}&size=${size}&crmStatus=${crmStatus}&search=${searchText}`
    );
  }

  getListTenantProspect(
    page: number,
    size: number,
    crmStatus?: string[],
    searchText?: string
  ) {
    return this.apiService.getAPI(
      properties,
      `tenant-prospects?size=${size}&page=${page}${
        crmStatus ? `&crmStatus=${crmStatus}` : ''
      }${searchText ? `&search=${searchText}` : ''}`
    );
  }

  getUserPropertyV2(userPropertyIds: string[]) {
    return this.apiService.postAPI(properties, 'v2/user-properties', {
      userPropertyIds
    });
  }

  getListTenantByTenancy(propertyId: string, userPropertyGroupId: string) {
    const endpoint = `list-tenant-by-tenancy?propertyId=${propertyId}&userPropertyGroupId=${userPropertyGroupId}`;
    return this.apiService.getAPI(properties, endpoint);
  }

  getLinkedContactsByEmail(
    email: string,
    userPropertyId: string,
    conversationType?: EConversationType
  ) {
    let endpoint = `contacts-by-email?email=${encodeURIComponent(email)}`;
    if (userPropertyId) {
      endpoint += `&userPropertyId=${userPropertyId}`;
    }

    if (conversationType) {
      endpoint += `&conversationType=${conversationType}`;
    }
    return this.apiService.getAPI(users, endpoint);
  }

  getLinkedContactsByEmailForFBUser(
    email: string,
    userPropertyId: string,
    channelUserId: string
  ) {
    const queryParamsObject = {
      email,
      userPropertyId,
      channelUserId
    };

    let httpParams = new HttpParams();
    Object.keys(queryParamsObject).forEach((key) => {
      if (queryParamsObject[key])
        httpParams = httpParams.set(key, queryParamsObject[key]);
    });

    const queryParamsString = httpParams.toString();

    let endpoint = `contacts-channel-user-by-email?${queryParamsString}`;
    return this.apiService.getAPI(users, endpoint);
  }

  getLinkedContactsByPhone(phoneNumber: string, exactMatch?: boolean) {
    let queryString =
      `contacts-by-phone?phoneNumber=${phoneNumber}` +
      (exactMatch ? `&exactMatch=${exactMatch}` : '');
    return this.apiService.getAPI(users, queryString);
  }

  getLinkedContactsSms(conversationId: string) {
    let queryString = `contacts-channel-phone?conversationId=${conversationId}`;
    return this.apiService.getAPI(users, queryString);
  }

  getTeamMember(userId: string) {
    return this.apiService.getAPI(users, 'pm/' + userId);
  }

  getListTenantsOwnersPT(paramsObject) {
    const query = queryString.stringify(paramsObject, {
      arrayFormat: 'bracket',
      skipEmptyString: true
    });
    return this.apiService.getAPI(
      properties,
      `v1/list-users-by-property?${query}`
    );
  }

  getListTenantsOwnersRM(params) {
    const queryString =
      this.userAgentService.combineToQueryStringParams(params);
    return this.apiService.getAPI(
      properties,
      `v1/list-users-by-property?${queryString}`
    );
  }
}
