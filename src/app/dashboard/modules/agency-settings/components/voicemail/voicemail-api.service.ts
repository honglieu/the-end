import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { agencies } from 'src/environments/environment';
import {
  IVoicemailSetting,
  IUpdateVoicemailSettingBody
} from '@/app/dashboard/modules/agency-settings/utils/enum';

@Injectable({
  providedIn: 'root'
})
export class VoicemailApiService {
  constructor(private apiService: ApiService) {}

  getVoicemailSetting(): Observable<IVoicemailSetting> {
    return this.apiService.getAPI(agencies, `get-voicemail-setting`);
  }

  updateVoicemailSetting(
    body: IUpdateVoicemailSettingBody
  ): Observable<IVoicemailSetting> {
    return this.apiService.postAPI(agencies, 'update-voicemail-setting', body);
  }
}
