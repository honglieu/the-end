import { Injectable } from '@angular/core';
import { conversations } from 'src/environments/environment';
import { ISyncPropertyTree } from '@/app/leasing/utils/leasingType';
import { ApiService } from '@services/api.service';

@Injectable({
  providedIn: 'root'
})
export class SyncPropertyTreeLeasingApiService {
  constructor(private apiService: ApiService) {}

  syncPropertyToPT(body: ISyncPropertyTree) {
    return this.apiService.postAPI(
      conversations,
      'leasing/sync-tenancy-to-property-tree',
      body
    );
  }

  getListAccountByIdToPT(agencyId: string) {
    return this.apiService.getAPI(
      conversations,
      'get-pt-account-without-user/',
      { agencyId }
    );
  }
}
