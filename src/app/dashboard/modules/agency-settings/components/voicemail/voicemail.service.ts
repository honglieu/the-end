import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, filter } from 'rxjs';
import { IVoicemailSetting } from '@/app/dashboard/modules/agency-settings/utils/enum';

@Injectable({
  providedIn: 'root'
})
export class VoicemailService {
  private voicemailSetting = new BehaviorSubject<IVoicemailSetting>(null);

  get voicemailSetting$(): Observable<IVoicemailSetting> {
    return this.voicemailSetting
      .asObservable()
      .pipe(filter((value) => !!value));
  }

  get voicemailSettingValue(): IVoicemailSetting {
    return this.voicemailSetting.getValue();
  }

  setVoicemailSetting(voicemailSetting: IVoicemailSetting) {
    this.voicemailSetting.next(voicemailSetting);
  }
}
