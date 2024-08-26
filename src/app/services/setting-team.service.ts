import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { agencies } from 'src/environments/environment';
import {
  UpdatePublicFacingProfile,
  UpdateRoleAgencyAdmin,
  UpdateRoleAgency
} from '@shared/types/team.interface';
import { AgencyService } from './agency.service';
import { ApiService } from './api.service';

declare const loader: any;

@Injectable({
  providedIn: 'root'
})
export class SettingTeamService {
  reloadPortfolios$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

  constructor(
    private apiService: ApiService,
    private agencyService: AgencyService
  ) {}

  updateRoleAgencyAdmin(userId: string) {
    return this.apiService.post<UpdateRoleAgencyAdmin, any>(
      `${agencies}team/assign-agency-administrator`,
      {
        userId
      }
    );
  }

  updatePublicFacingProfile(body: UpdatePublicFacingProfile) {
    return this.apiService.post<UpdatePublicFacingProfile, any>(
      `${agencies}team/public-facing-profile`,
      body
    );
  }

  updateRole(body: UpdateRoleAgency) {
    return this.apiService.post<UpdateRoleAgency, any>(
      `${agencies}team/assign-agency-role`,
      body
    );
  }
}
