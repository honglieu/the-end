import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { agencies } from 'src/environments/environment';
import {
  IBaseOptionDto,
  IRemoveOptionDto
} from '@/app/dashboard/modules/agency-settings/utils/interface';

@Injectable({
  providedIn: 'root'
})
export class SharedAgencySettingsApiService {
  constructor(private apiService: ApiService) {}

  getSelectedOptions() {
    return this.apiService.getAPI(agencies, `policies/options`);
  }

  upsertOptions(payload: IBaseOptionDto[]) {
    return this.apiService.post<IBaseOptionDto[], null>(
      `${agencies}/policies/options`,
      payload
    );
  }

  removeOptions(payload: IRemoveOptionDto) {
    return this.apiService.deleteAPI(
      agencies,
      `policies-option-config`,
      payload
    );
  }
}
