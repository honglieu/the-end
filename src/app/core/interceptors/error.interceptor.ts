import { ErrorHandler, Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler
} from '@angular/common/http';
import { Auth0Service } from '@services/auth0.service';
import { Observable, of, BehaviorSubject, EMPTY } from 'rxjs';
import { catchError, switchMap, timeout } from 'rxjs/operators';
import { AuthService } from '@services/auth.service';
import { IRefreshTokenResponse } from './interface';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

const NEED_TO_REFRESH = ['current-user', 'user-agencies'];
const API_KEYS = [
  'http://localhost:3001',
  'https://api.attic.trulet.com',
  'https://api.cellar.trulet.com',
  'https://api.prod.trulet.com',
  'https://api.preprod.trulet.com',
  'https://us.api.trudi.ai',
  'https://api.stage.trulet.com'
];

const END_POINTS_EXCLUDE_HANDLE_TIMEOUT = [
  '/conversations/client-typing',
  '/conversations/v4/statistic-task',
  '/conversations/statistic-global-task',
  '/conversations/statistic-task-channel',
  '/syncs/get-status-sync-agencies-by-companyId'
];
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private refreshTokenSubject: BehaviorSubject<string> =
    new BehaviorSubject<string>(null);

  private timeoutHandleCount = 0;
  constructor(
    private auth0Service: Auth0Service,
    private authService: AuthService,
    private errorHandler: ErrorHandler,
    private toastCustomService: ToastCustomService
  ) {}

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    const timeoutDuration = 60000; // 1 minute
    return next.handle(req).pipe(
      timeout(timeoutDuration),
      catchError((error) => {
        let url;
        try {
          url = new URL(req.url);
        } catch (error) {
          throw error;
        }

        if (
          (error?.name === 'TimeoutError' || error.status === 502) &&
          !END_POINTS_EXCLUDE_HANDLE_TIMEOUT.includes(url.pathname)
        ) {
          if (this.timeoutHandleCount == 0) {
            this.toastCustomService.openToastFailedToConnect();
            this.timeoutHandleCount++;
          }
        }

        if (!API_KEYS.includes(url?.origin)) {
          throw error;
        }

        if (error.status === 409) {
          this.toastCustomService.openToastReloadPage();
          this.auth0Service.supportedVersionPopap.next(true);
          return EMPTY;
        }

        const errorToReport = new Error(error.message);
        errorToReport.name = 'HttpErrorResponse';
        errorToReport.stack = JSON.stringify(
          error,
          Object.getOwnPropertyNames(error)
        );
        this.errorHandler.handleError(errorToReport);

        if (error.status === 401) {
          return this.handleUnauthorizedError(null, 401);
        } else if (
          error.status === 404 &&
          NEED_TO_REFRESH.some((api) => error.url.includes(api))
        ) {
          return this.handleUnauthorizedError(true);
        } else if (error.status === 403) {
          return this.auth0Service.logout();
        }
        throw error;
      })
    );
  }

  private handleUnauthorizedError(autoLogin?: boolean, errorStatus?: Number) {
    if (this.auth0Service.getIsRememberme()) {
      this.refreshTokenSubject.next(null);
      const token = this.auth0Service.getRefreshToken();
      const count = +(sessionStorage.getItem('refresh') || 0);
      // Maximum refresh token is 3 times
      if (token && count < 3 && errorStatus && errorStatus === 401) {
        return this.authService.refreshToken(token).pipe(
          switchMap((res: IRefreshTokenResponse) => {
            this.auth0Service.saveAccessToken(res.id_token);
            this.refreshTokenSubject.next(res.id_token);
            sessionStorage.clear();
            window.location.reload();
            return of({});
          }),
          catchError((error) => {
            sessionStorage.setItem('refresh', `${count + 1}`);
            this.auth0Service.logout(autoLogin);
            throw error;
          })
        );
      } else if (autoLogin) {
        return this.auth0Service.logout(autoLogin);
      }
    }
    return of(
      this.auth0Service.logout().subscribe(() => {
        this.auth0Service.deleteAllCookies();
      })
    );
  }
}
