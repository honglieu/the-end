import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { users } from 'src/environments/environment';
import {
  IGetListUserPayload,
  IGetListUserResponse
} from '@/app/dashboard/modules/agency-settings/components/policies/utils/polices-interface';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

@Injectable({
  providedIn: 'root'
})
export class PoliciesApiService {
  constructor(private apiService: ApiService) {}

  getListSupplierApi(
    body: IGetListUserPayload
  ): Observable<IGetListUserResponse | ISelectedReceivers[]> {
    return this.apiService.postAPI(users, 'get-list-user', body);
  }
}
