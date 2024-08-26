import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of, EMPTY } from 'rxjs';
import { map, concatMap, tap, catchError } from 'rxjs/operators';

import {
  agencies,
  configFacebookApplication,
  conversations
} from '@/environments/environment';
import {
  FacebookLoginResponse,
  FacebookPage,
  FacebookPayloadIntegrateType,
  FacebookSDK,
  FacebookOpenFrom,
  SelectFacebookPage,
  FacebookUserInfoType,
  PageFacebookMessengerType,
  IIntegrateFacebookPageApiRes
} from '@/app/dashboard/shared/types/facebook-account.interface';
import { ApiService } from '@services/api.service';

declare const FB: FacebookSDK;

@Injectable({ providedIn: 'root' })
export class FacebookAccountService {
  private openFrom: FacebookOpenFrom = FacebookOpenFrom.inbox;
  public currentPageMessengerActive$: BehaviorSubject<PageFacebookMessengerType> =
    new BehaviorSubject<PageFacebookMessengerType>(null);
  public showSelectFacebookPage$: BehaviorSubject<SelectFacebookPage> =
    new BehaviorSubject({ state: false, openFrom: this.openFrom });
  public facebookPageLoading$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public lockEvent: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public facebookPagesBS: BehaviorSubject<FacebookPage> = new BehaviorSubject(
    null
  );
  public facebookPages$: Observable<FacebookPage> = this.facebookPagesBS.pipe(
    tap(() => {
      this.facebookPageLoading$.next(false);
    })
  );

  constructor(private apiService: ApiService) {}

  public updateStateNew(isNew: boolean) {
    this.currentPageMessengerActive$.next({
      ...this.currentPageMessengerActive$.getValue(),
      isNew
    });
  }

  login(openFrom?) {
    if (this.openFrom) this.openFrom = openFrom;

    this.logout();
    // login with facebook then the API to get a JWT auth token
    return this.loginWithFacebook().pipe(
      concatMap((userInfo) =>
        this.fetchFacebookPagesAndShowPopup(
          userInfo as unknown as FacebookUserInfoType
        )
      )
    );
  }

  logout() {
    FB.getLoginStatus((response) => {
      if (response?.status === 'connected') {
        FB.logout();
      }
    });
  }

  disconnectFacebookChannel(): Observable<PageFacebookMessengerType> {
    return this.apiService.postAPI(
      agencies,
      `archive-facebook-channel/${this.currentPageMessengerActive$.value.id}`,
      {}
    );
  }

  private loginWithFacebook(): Observable<FacebookUserInfoType | string> {
    // login with facebook and return observable with fb access token on success
    this.lockEvent.next(true);
    const fbLoginPromise = new Promise<FacebookLoginResponse>((resolve) =>
      FB.login(resolve, {
        scope: configFacebookApplication.SCOPE
      })
    );

    return from(fbLoginPromise).pipe(
      tap(() => this.lockEvent.next(false)),
      concatMap(({ authResponse }) =>
        authResponse
          ? of({
              accessToken: authResponse.accessToken,
              userId: authResponse.userID
            })
          : EMPTY
      ),
      catchError(this.handleError<string>('loginWithFacebook'))
    );
  }

  integrateFacebookPageApi(
    payload: FacebookPayloadIntegrateType
  ): Observable<IIntegrateFacebookPageApiRes> {
    this.lockEvent.next(true);
    return this.apiService
      .postAPI(conversations, 'integrate-facebook-page', payload)
      .pipe(
        tap(() => this.lockEvent.next(false)),
        map((data) => {
          this.currentPageMessengerActive$.next(data?.dataValues);
          return data;
        })
      );
  }

  fetchFacebookPagesAndShowPopup(userInfo: FacebookUserInfoType) {
    if (!userInfo.accessToken) return EMPTY;
    this.showSelectFacebookPage$.next({ state: true, openFrom: this.openFrom });
    this.facebookPageLoading$.next(true);

    const getFacebookPages = new Promise<FacebookPage>((resolve) =>
      FB.api(
        '/me/accounts',
        { fields: 'name,email,picture,id,access_token' },
        resolve
      )
    );

    return from(getFacebookPages).pipe(
      tap((data) =>
        this.facebookPagesBS.next({
          ...data,
          openFrom: this.openFrom,
          userInfo
        })
      ),
      catchError(this.handleError<string>('fetchFacebookPagesAndShowPopup'))
    );
  }

  private handleError<T>(operation = 'operation') {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return EMPTY;
    };
  }

  reset() {
    this.showSelectFacebookPage$.next({
      state: false,
      openFrom: this.openFrom
    });
    this.lockEvent.next(false);
  }
}
