import { ApiService } from './api.service';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import Auth0Lock from 'auth0-lock';
import * as auth0 from 'auth0-js';
import { LocalStorageService } from './local.storage';
import { BehaviorSubject, Subject, Observable, lastValueFrom } from 'rxjs';
import { auth, env } from 'src/environments/environment';
import { UserService } from './user.service';
import { FirebaseService } from './firebase.service';
import { uuidv4Regex } from './constants';
import { finalize, map, retry, takeUntil } from 'rxjs/operators';
import { ElectronService } from './electron.service';
import { APP_LOGOUT, CHANGE_COMPANY } from '@/helpers/electron/constants';
import { captureExceptionToSentry } from '@/app/sentry';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Auth0DecodedHash, Auth0ParseHashError } from 'auth0-js';
import { JwtPayload, jwtDecode } from 'jwt-decode';
import { captureMessage } from '@sentry/angular-ivy';

const config = {
  test: {
    env_client_id: '7a36NpTcGMi278KQCQm5WaRyBzumSTET'
  },
  attic: {
    env_client_id: 'QJL930vdvCuRBS7cy0ckZRy3r7zjRbPC'
  },
  cellar: {
    env_client_id: 'QJL930vdvCuRBS7cy0ckZRy3r7zjRbPC'
  },
  stage: {
    env_client_id: 'omWScWI7uJCJ957Ha2biwb0yBOyo1eAr'
  },
  sandbox: {
    env_client_id: '7a36NpTcGMi278KQCQm5WaRyBzumSTET'
  },
  preprod: {
    env_client_id: 'PyUO6OTBwTxXPwQYWfkzeg2oVr8umnze'
  },
  live: {
    env_client_id: 'cVgFPmaJxvLCeO2u4e8EQzPkmCmYWoYC'
  },
  produs: {
    env_client_id: '3wwdhkGJMYKDz4CvzXrry7rUN3yukmqS'
  }
};

@Injectable({
  providedIn: 'root'
})
export class Auth0Service {
  public supportedVersionPopap: Subject<boolean> = new Subject();
  public loggedIn: BehaviorSubject<boolean>;
  private unsubscribe = new Subject<void>();
  public auth0 = new auth0.WebAuth({
    clientID: config[env].env_client_id,
    domain: 'trulet.au.auth0.com',
    responseType: 'id_token',
    redirectUri: `${window.location.origin}/dashboard`,
    scope: 'openid profile email'
  });
  private lock = new Auth0Lock(
    config[env].env_client_id,
    'trulet.au.auth0.com',
    {
      theme: {
        logo: `${window.location.origin}/assets/images/trulet_logo.png`,
        primaryColor: '#30bfb6'
      },
      auth: {
        redirect: true,
        responseType: 'id_token',
        params: {
          scope: 'openid profile email'
        }
      },
      autoclose: true,
      oidcConformant: true,
      allowSignUp: false,
      allowForgotPassword: false
    }
  );

  constructor(
    public router: Router,
    private localStorageService: LocalStorageService,
    private apiService: ApiService,
    private userService: UserService,
    private firebaseService: FirebaseService,
    private electronService: ElectronService,
    private indexedDBService: NgxIndexedDBService
  ) {}

  public login(): void {
    const hasLogin: boolean = Boolean(this.getAccessToken());
    if (!hasLogin) {
      this.lock.show();
    }
  }

  public async handleAuthentication(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.auth0.parseHash(
          (error: Auth0ParseHashError, authResult: Auth0DecodedHash | null) => {
            if (authResult && authResult.idToken) {
              this.saveAccessToken(authResult.idToken);
              this.lock.hide();
              this.startAgentFlow(authResult.idTokenPayload);
              this.userService.setAgentAvatar(
                authResult.idTokenPayload.picture
              );
              this.localStorageService.setValue(
                'AgentAvatar',
                authResult.idTokenPayload.picture
              );
              resolve(true);
            } else if (error) {
              captureExceptionToSentry(error);
              alert(
                `Error: ${error.error}. Check the console for further details.`
              );
              resolve(false);
            }
          }
        );
      } catch (error) {
        captureExceptionToSentry(error);
        resolve(false);
      }
    });
  }

  public logout(autoLogin?: boolean): Observable<any> {
    return this.firebaseService.unregisterPushToken().pipe(
      finalize(() => {
        let url = window.location.origin;
        if (this.electronService.isElectronApp) {
          this.electronService.ipcRenderer.send(APP_LOGOUT);
          this.electronService.ipcRenderer.send(CHANGE_COMPANY, null);
        }
        const token = this.getAccessToken();
        // token to pass to login check
        const queryParams = autoLogin
          ? `?token=${token}&autologin=true&navigatePath=${window.location.pathname}`
          : '';

        this.localStorageService.clearLocalStorage();
        this.indexedDBService.deleteDatabase().subscribe();
        this.auth0.logout({
          returnTo: `${url}${queryParams}`
        });
      })
    );
  }

  public getAccessToken(): string {
    return this.localStorageService.getValue('_idToken');
  }

  public getRefreshToken(): string {
    return this.localStorageService.getValue('refresh_token');
  }

  public saveAccessToken(token: string) {
    if (!token) return;
    this.localStorageService.setValue('_idToken', token);
  }

  public getIsRememberme() {
    return JSON.parse(this.localStorageService.getValue('rememberme') || null);
  }

  private startAgentFlow(data: {
    email: string;
    given_name: string;
    family_name: string;
    sub: string;
    picture: string;
  }) {
    const UserDetails = {
      email: data.email,
      firstName: data.given_name,
      lastName: data.family_name,
      googleId: data.sub.split('|')[1],
      googleAvatar: data.picture
    };
    this.apiService.postAPI(auth, 'check-user', UserDetails).subscribe(
      () => {
        const propId = this.localStorageService.getValue('propId');
        const agencyId = this.localStorageService.getValue('agencyId');
        const legitIds = uuidv4Regex.test(propId) && uuidv4Regex.test(agencyId);
        if (legitIds) {
          this.router.navigate([`/dashboard/messages/${propId}`]);
          this.localStorageService.setValue('propId', '');
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      (err) => {
        captureExceptionToSentry(
          {
            message: 'FORCED_LOGOUT:ERROR - startAgentFlow',
            error: err
          },
          { level: 'error' }
        );
        this.logout().subscribe();
      }
    );
  }

  deleteAllCookies() {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      var eqPos = cookie.indexOf('=');
      var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  handleLogout() {
    this.deleteAllCookies();
    this.logout().pipe(takeUntil(this.unsubscribe)).subscribe();
  }

  /**
   * refresh token if token does not have `user_id`
   */
  public async referenceTokenIfNeed() {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return;
      }

      const decodedToken = this.decodeToken(token);
      if (decodedToken?.user_id) {
        return;
      }

      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        setTimeout(() => {
          // schedule for avoid blocking main thread
          captureMessage('No refresh token found', 'debug');
        }, 0);
        return;
      }

      const response = await lastValueFrom(
        this.apiService
          .post(`${auth}/refresh-token`, {
            refresh_token: refreshToken
          })
          .pipe(
            map((response) => response?.body),
            retry({ count: 2, delay: 1000 })
          )
      );
      const newToken = response?.['id_token'];
      const newDecodedToken = this.decodeToken(newToken);
      if (newDecodedToken?.user_id) {
        this.saveAccessToken(newToken);
        return;
      }
      this.handleLogout();
    } catch (error) {
      captureExceptionToSentry(error);
    }
  }

  private decodeToken(token: string) {
    if (token) {
      return jwtDecode<
        JwtPayload & {
          user_id: string;
          agency_ids: string[];
          company_ids: string[];
        }
      >(token);
    }
    return null;
  }
}
