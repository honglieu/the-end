import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { auth, users } from 'src/environments/environment';
import { IRememberData, IRememberStore } from '@shared/types/auth.interface';
import { portfolio } from '@shared/types/team.interface';
import { ApiService } from './api.service';
import { ElectronService } from './electron.service';
import { LocalStorageService } from './local.storage';

const GET_REMEMBER_ME = 'GET:::REMEMBER_ME';
const SAVE_REMEMBER_ME = 'SAVE:::REMEMBER_ME';
const DELETE_REMEMBER_ME = 'DELETE:::REMEMBER_ME';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  reloadPortfolios$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  private rememberStore$: BehaviorSubject<IRememberStore> =
    new BehaviorSubject<IRememberStore>({});
  private rememberStatus$: BehaviorSubject<IRememberStore> =
    new BehaviorSubject<IRememberStore>({});

  public permissions: any = [];

  constructor(
    private apiService: ApiService,
    private electronService: ElectronService,
    private localStorageService: LocalStorageService
  ) {
    if (this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.on(SAVE_REMEMBER_ME, (event, arg) => {
        this.rememberStatus$.next(arg);
      });

      this.electronService.ipcRenderer.on(GET_REMEMBER_ME, (event, arg) => {
        this.rememberStore$.next(arg);
      });
    }
  }

  isAuthenticated(): boolean {
    return this.localStorageService.getValue('_idToken');
  }

  login(data, url?: string): Observable<any> {
    return this.apiService.postAPI(`${url || auth}`, 'pm-login', data);
  }

  forgotPassword(email: string): Observable<any> {
    return this.apiService.postAPI(`${auth}/pm-onboard/`, 'forgot-password', {
      email
    });
  }

  resetPassword(password: string, token: string): Observable<any> {
    return this.apiService.putAPI(
      `${auth}`,
      'set-new-password',
      {
        password,
        token
      },
      undefined
    );
  }

  resetPasswordInApp(password: string): Observable<any> {
    return this.apiService.putAPI(`${users}`, 'set-new-password', {
      password
    });
  }

  getPortfoliosByType(type?: string, search?: string): Observable<portfolio[]> {
    return this.apiService.getAPI(
      users,
      `get-portfolios?type=${type}${search ? '&search=' + search : ''}`
    );
  }

  checkCurrentPassword(email: string, password: string) {
    const body = {
      email,
      password
    };
    return this.apiService.postAPI(users, 'check-current-password', body);
  }

  updatePortfolios(
    propertyManagerIds: string[],
    agencyId: string,
    isActive: boolean
  ) {
    return this.apiService.postAPI(users, 'v2/update-portfolios', {
      propertyManagerIds,
      agencyId,
      isActive
    });
  }

  updateAvatar(formData: FormData) {
    return this.apiService.postFormAPI(users, 'update-avatar', formData);
  }

  refreshToken(refresh_token: string): Observable<any> {
    return this.apiService.postAPI(`${auth}`, 'refresh-token', {
      refresh_token
    });
  }

  getRememberStore() {
    if (this.electronService.checkElectronApp()) {
      this.electronService.ipcRenderer.send(GET_REMEMBER_ME);
    }

    return this.rememberStore$.asObservable();
  }

  setRememberStore(value: IRememberData) {
    if (this.electronService.checkElectronApp()) {
      this.electronService.ipcRenderer.send(SAVE_REMEMBER_ME, value);
    }

    return this.rememberStatus$.asObservable();
  }

  deleteRememberStore() {
    if (this.electronService.checkElectronApp()) {
      this.electronService.ipcRenderer.send(DELETE_REMEMBER_ME);
    }
  }
}
