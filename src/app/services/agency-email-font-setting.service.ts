import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { agencies } from 'src/environments/environment';
import { BehaviorSubject, tap } from 'rxjs';

export type FontSetting = {
  fontStyle: string;
  fontSize: string;
};

@Injectable({
  providedIn: 'root'
})
export class AgencyEmailFontSettingService {
  public fontSetting: BehaviorSubject<FontSetting> = new BehaviorSubject({
    fontStyle: '',
    fontSize: ''
  });

  constructor(private apiService: ApiService) {}

  updateFontSettings(body) {
    return this.apiService.postAPI(
      agencies,
      'update-company-email-style-setting',
      body
    );
  }

  getFontSettings() {
    return this.apiService
      .getAPI(agencies, 'get-company-email-style-setting')
      .pipe(
        tap((data) => {
          this.fontSetting.next(data);
        })
      );
  }
}
