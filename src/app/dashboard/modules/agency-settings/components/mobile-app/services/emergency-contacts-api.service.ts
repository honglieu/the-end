import { ApiService } from '@services/api.service';
import { agencies } from '@/environments/environment';
import { Injectable } from '@angular/core';
import {
  ICreateSupplierPolicy,
  ISelectContacts
} from '@/app/dashboard/modules/agency-settings/utils/interface';
import { tap } from 'rxjs';
import {
  IDefaultEmergencyContact,
  IPTCustomEmergencyContactResponse,
  IRMCustomEmergencyContactResponse,
  ITypeOption
} from '@/app/dashboard/modules/agency-settings/components/mobile-app/types/emergency-contacts.interface';

@Injectable()
export class EmergencyContactsApiService {
  constructor(private apiService: ApiService) {}

  getApiListSupplier(propertyId?: string) {
    const url = propertyId
      ? `${agencies}list-supplier-policies?propertyId=${propertyId}`
      : `${agencies}list-supplier-policies`;

    return this.apiService.getData<ISelectContacts[]>(url).pipe(
      tap((response) => {
        return response;
      })
    );
  }

  createSupplierPolicies(body: ICreateSupplierPolicy) {
    return this.apiService.post(`${agencies}supplier-policies`, body);
  }

  getAllEmergencyContactsTypes() {
    return this.apiService.getAPI(agencies, 'get-emergency-contact-type');
  }

  getDefaultEmergencyContacts() {
    return this.apiService.getAPI(agencies, 'default-emergency-contact');
  }

  getPTCustomerEmergencyContacts() {
    return this.apiService.getAPI(agencies, 'pt-custom-emergency-contact');
  }

  getRMCustomerEmergencyContacts() {
    return this.apiService.getAPI(agencies, 'rm-custom-emergency-contact');
  }

  updateDefaultEmergencyContacts(body: IDefaultEmergencyContact) {
    return this.apiService.postAPI(
      agencies,
      'update-default-emergency-contact',
      body
    );
  }

  updatePTCustomEmergencyContacts(body: IPTCustomEmergencyContactResponse) {
    return this.apiService.postAPI(
      agencies,
      'pt-update-custom-emergency-contact',
      body
    );
  }

  updateRMCustomEmergencyContacts(body: IRMCustomEmergencyContactResponse) {
    return this.apiService.postAPI(
      agencies,
      'rm-update-custom-emergency-contact',
      body
    );
  }

  deleteDefaultEmergencyContacts(groupId: string) {
    return this.apiService.deleteAPI(
      agencies,
      'delete-default-emergency-contact',
      {
        groupId
      }
    );
  }

  deleteCustomEmergencyContactsByGroupType(groupTypeId: string) {
    return this.apiService.deleteAPI(
      agencies,
      'delete-custom-emergency-contact-by-group-type',
      {
        groupTypeId
      }
    );
  }

  deleteCustomEmergencyContactsByGroup(groupId: string) {
    return this.apiService.deleteAPI(
      agencies,
      'delete-custom-emergency-contact-by-group',
      {
        groupId
      }
    );
  }

  createEmergencyContactsType(name: string) {
    return this.apiService.postAPI(agencies, 'create-emergency-contact-type', {
      name
    });
  }

  deleteEmergencyContactsType(id: string) {
    return this.apiService.deleteAPI(
      agencies,
      'delete-emergency-contact-type/' + id
    );
  }

  updateEmergencyContactsType(body: ITypeOption) {
    return this.apiService.putAPI(
      agencies,
      'update-emergency-contact-type',
      body
    );
  }
}
