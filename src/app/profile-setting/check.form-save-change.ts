import { Injectable } from '@angular/core';
import { UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { ProfileSettingService } from '@services/profile-setting.service';
interface CanComponentDeactivate {
  isFormSaveChange: () => Observable<boolean> | Promise<boolean> | boolean;
  openDialog(): void;
}
@Injectable({ providedIn: 'root' })
export class CheckFormSaveChange {
  constructor(private profileSetting: ProfileSettingService) {}
  canDeactivate(
    component: CanComponentDeactivate
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    if (component.isFormSaveChange()) {
      return true;
    } else {
      component.openDialog();
      return this.profileSetting.leaveWarning.asObservable();
    }
  }
}
