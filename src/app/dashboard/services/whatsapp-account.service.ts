import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of, EMPTY } from 'rxjs';
import { map, concatMap, tap, catchError } from 'rxjs/operators';

import { agencies, conversations } from '@/environments/environment';
import {
  WhatsappLoginResponse,
  WhatsappPage,
  WhatsappPayloadIntegrateType,
  WhatsappSDK,
  WhatsappOpenFrom,
  SelectWhatsappPage,
  WhatsappUserInfoType,
  PageWhatsAppType
} from '@/app/dashboard/shared/types/whatsapp-account.interface';
import { ApiService } from '@/app/services/api.service';

declare const FB: WhatsappSDK;

@Injectable({ providedIn: 'root' })
export class WhatsappAccountService {
  private openFrom: WhatsappOpenFrom = WhatsappOpenFrom.inbox;
  public currentPageWhatsappActive$: BehaviorSubject<PageWhatsAppType> =
    new BehaviorSubject<PageWhatsAppType>(null);
  public showSelectWhatsappPage$: BehaviorSubject<SelectWhatsappPage> =
    new BehaviorSubject(null);
  public whatsappPageLoading$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public lockEvent: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public whatsappPagesBS: BehaviorSubject<WhatsappPage> = new BehaviorSubject(
    null
  );
  public whatsappPages$: Observable<WhatsappPage> = this.whatsappPagesBS.pipe(
    tap(() => {
      this.whatsappPageLoading$.next(false);
    })
  );

  constructor(private apiService: ApiService) {}

  login(openFrom?) {
    if (this.openFrom) this.openFrom = openFrom;

    // login with whatsapp then the API to get a JWT auth token
    return this.loginWithWhatsapp().pipe(
      concatMap((userInfo) =>
        this.fetchWhatsappPagesAndShowPopup(
          userInfo as unknown as WhatsappUserInfoType
        )
      )
    );
  }

  logout(): Observable<PageWhatsAppType> {
    return this.apiService.postAPI(
      agencies,
      `archive-whatsapp-channel/${this.currentPageWhatsappActive$.value.id}`,
      {}
    );
  }

  private loginWithWhatsapp(): Observable<WhatsappUserInfoType | string> {
    // login with whatsapp and return observable with fb access token on success
    return of();
    // this.lockEvent.next(true);
    // const fbLoginPromise = new Promise<WhatsappLoginResponse>((resolve) =>
    //   FB.login(resolve, {
    //     scope: configWhatsappApplication.SCOPE
    //   })
    // );

    // return from(fbLoginPromise).pipe(
    //   tap(() => this.lockEvent.next(false)),
    //   concatMap(({ authResponse }) =>
    //     authResponse
    //       ? of({
    //           accessToken: authResponse.accessToken,
    //           userId: authResponse.userID
    //         })
    //       : EMPTY
    //   ),
    //   catchError(this.handleError<string>('loginWithWhatsapp'))
    // );
  }

  integrateWhatsappPageApi(
    payload: WhatsappPayloadIntegrateType
  ): Observable<PageWhatsAppType> {
    this.lockEvent.next(true);
    return this.apiService
      .postAPI(conversations, 'integrate-whatsapp-page', payload)
      .pipe(
        tap(() => this.lockEvent.next(false)),
        map((data) => {
          this.currentPageWhatsappActive$.next(data);
          return data;
        })
      );
  }

  fetchWhatsappPagesAndShowPopup(userInfo: WhatsappUserInfoType) {
    if (!userInfo.accessToken) return EMPTY;
    this.showSelectWhatsappPage$.next({ state: true, openFrom: this.openFrom });
    this.whatsappPageLoading$.next(true);

    const getWhatsappPages = new Promise<WhatsappPage>((resolve) =>
      FB.api(
        '/me/accounts',
        { fields: 'name,email,picture,id,access_token' },
        resolve
      )
    );

    return from(getWhatsappPages).pipe(
      tap((data) =>
        this.whatsappPagesBS.next({
          ...data,
          openFrom: this.openFrom,
          userInfo
        })
      ),
      catchError(this.handleError<string>('fetchWhatsappPagesAndShowPopup'))
    );
  }

  private handleError<T>(operation = 'operation') {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return EMPTY;
    };
  }
}
