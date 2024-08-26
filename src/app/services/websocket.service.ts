import { Injectable } from '@angular/core';
import {
  EMPTY,
  interval,
  Observable,
  Subject,
  Subscription,
  timer
} from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Auth0Service } from './auth0.service';
import { webSocketUrl } from 'src/environments/environment';
import { UserService } from './user.service';
import {
  catchError,
  delayWhen,
  retryWhen,
  shareReplay,
  switchAll,
  tap,
  filter
} from 'rxjs/operators';
import { PropertiesService } from './properties.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private webSocketUrl: string = webSocketUrl;
  public currentUserId: string = '';
  private socket$: WebSocketSubject<any>;
  private messagesSubject$ = new Subject<any>();
  public messages$ = this.messagesSubject$.pipe(
    switchAll(),
    catchError((e) => {
      throw e;
    })
  );
  private WS_ENDPOINT: string = '';
  public onMessage = new Subject<any>();
  public onMessage$ = this.onMessage.pipe(shareReplay());
  public propertyId: string = '';
  private subscription: Subscription;
  constructor(
    private auth0Service: Auth0Service,
    private userService: UserService,
    private propertyService: PropertiesService
  ) {
    this.propertyService.currentProperty
      .pipe(filter((res) => (res && res.id ? true : false)))
      .subscribe((property) => {
        this.propertyId = property.id;
      });
    this.userService.selectedUser
      .pipe(filter((res) => (res.id ? true : false)))
      .subscribe((res) => {
        this.WS_ENDPOINT =
          this.webSocketUrl +
          `?Authorization=Bearer ${this.auth0Service.getAccessToken()}&userId=${
            res.id
          }`;
      });
  }

  public createConnection() {
    if (!this.socket$ || (this.socket$ && this.socket$.closed)) {
      this.socket$ = this.getNewWebSocket();
      this.joinConnection();
    }
  }

  public connect(cfg: { reconnect: boolean } = { reconnect: false }): void {
    try {
      if (this.socket$ && !this.socket$.closed) {
        this.socket$.subscribe((data) => {
          if (
            (data && data.userId && data.propertyId) ||
            data.type === 'SYNC' ||
            data.type === 'MASK_READ' ||
            data.params ||
            data.messageType === 'CALL'
          ) {
            this.onMessage.next(JSON.stringify(data));
          }
        });
        const messages = this.socket$.pipe(
          cfg.reconnect ? this.reconnect : (o) => o,
          tap({
            error: (error) => console.log(error)
          }),
          catchError((_) => EMPTY)
        );
        this.messagesSubject$.next(messages);
      } else {
        this.socket$ = this.getNewWebSocket();
        this.joinConnection();
      }
    } catch (error) {
      console.log('WS Error', error);
    }
  }

  public getNewWebSocket() {
    return webSocket({
      url: this.WS_ENDPOINT,
      closeObserver: {
        next: () => {
          this.socket$ = undefined;
          this.connect({ reconnect: true });
        }
      }
    });
  }
  sendMessage(msg: any) {
    if (!this.socket$) {
      this.socket$ = this.getNewWebSocket();
    }
    this.socket$.next(msg);
  }
  close() {
    this.socket$.complete();
  }

  pingReconnect() {
    if (!this.socket$) {
      this.socket$ = this.getNewWebSocket();
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    const timeToCheckWS = 30000;
    this.subscription = interval(timeToCheckWS).subscribe(() => {
      const param = {
        action: '$default',
        type: 'PING',
        userId: this.userService.selectedUser.value.id,
        Authorization: 'Bearer ' + this.auth0Service.getAccessToken()
      };
      this.sendMessage(param);
    });
  }

  joinConnection() {
    this.userService.selectedUser
      .pipe(filter((res) => (res.id ? true : false)))
      .subscribe((res) => {
        const param = {
          action: '$default',
          type: 'JOIN',
          userId: res.id,
          Authorization: 'Bearer ' + this.auth0Service.getAccessToken()
        };
        this.sendMessage(param);
      });
  }

  private reconnect(observable: Observable<any>): Observable<any> {
    return observable.pipe(
      retryWhen((errors) =>
        errors.pipe(
          tap((val) => console.log('[Data Service] Try to reconnect', val)),
          delayWhen((_) => timer(3000))
        )
      )
    );
  }
}
