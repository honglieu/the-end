import { aiWebSocketUrl } from '@/environments/environment';
import { Injectable, NgZone } from '@angular/core';
import {
  Observable,
  Subject,
  distinctUntilChanged,
  filter,
  map,
  retry,
  share,
  switchMap,
  tap
} from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import {
  TrudiAIWebSocketResponse,
  TrudiAIWebSocketAction,
  TrudiAIWebSocketSubject
} from './types';
import { TrudiWebSocketMapperService } from './trudi-websocket-mapper.service';
import { Auth0Service } from '@services/auth0.service';
import { CompanyService } from '@services/company.service';
import { ToastrService } from 'ngx-toastr';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Injectable({
  providedIn: 'root'
})
export class TrudiAIWebSocketService {
  private _websocket$: TrudiAIWebSocketSubject | undefined;
  private _threadId: string;
  private _socketUrl: string;
  private readonly _maxReconnectTime: number = 3;
  private readonly _reconnectInterval: number = 3000; // 3 seconds
  private readonly _pingInterval: number = 25000; // 25 seconds
  private readonly _serverMessage$ = new Subject<TrudiAIWebSocketResponse>();
  public readonly serverMessage$ = this._serverMessage$
    .asObservable()
    .pipe(share());
  private _pingIntervalId: NodeJS.Timeout;

  constructor(
    private readonly zone: NgZone,
    private readonly mapper: TrudiWebSocketMapperService,
    private readonly auth0Service: Auth0Service,
    private readonly companyService: CompanyService,
    private toastService: ToastrService,
    private toastCustomService: ToastCustomService
  ) {}

  public connect(threadId: string): Observable<TrudiAIWebSocketResponse> {
    this._threadId = threadId;
    return this.companyService.getCurrentCompanyId().pipe(
      filter(Boolean),
      distinctUntilChanged(),
      switchMap((companyId) => {
        const token = this.auth0Service.getAccessToken();
        this.setSocketUrl(companyId, token);
        return this._connect(this._socketUrl);
      })
    );
  }

  joinThread() {
    this.sendMessage({
      action: TrudiAIWebSocketAction.JOIN,
      thread_id: this._threadId,
      sender: 'human',
      payload: ''
    });
  }

  public disconnect(): void {
    this._disconnect();
    this._stopPing();
  }

  /**
   * send message to server
   * @param message
   */
  public sendMessage(message: TrudiAIWebSocketResponse): void {
    this._sendMessage(message);
  }

  public onReceiveMessage<TModel>(
    action: TrudiAIWebSocketAction
  ): Observable<TModel>;
  public onReceiveMessage<TModel>(
    messageFilterPredicate: (message: unknown) => boolean
  ): Observable<TModel>;
  public onReceiveMessage<TModel>(
    arg: string | ((message: unknown) => boolean) | undefined
  ): Observable<TModel> {
    const messages$ = this.serverMessage$.pipe(
      map((message) => this.mapper.toModel<TModel>(message.action, message))
    );
    if (arg === undefined) {
      return messages$;
    }
    if (typeof arg === 'string') {
      return messages$.pipe(filter((message) => message['action'] === arg));
    }
    return messages$.pipe(filter((message) => arg(message)));
  }

  private _connect(url: string) {
    if (this._websocket$) {
      this._disconnect();
    }
    this._websocket$ = this._init(url);
    return this._websocket$.pipe(
      tap({
        next: (message) => {
          // console.debug('[TrudiAIWebSocketService] message', message);
          this._serverMessage$.next(message);
        },
        error: (error) => {
          this.toastCustomService.handleShowAiSocketError();
          // console.error('[TrudiAIWebSocketService] error', error);
        },
        complete: () => {
          // console.debug('[TrudiAIWebSocketService] complete');
        }
      }),
      retry({
        count: this._maxReconnectTime,
        delay: this._reconnectInterval
      })
    );
  }

  private _init(url: string): TrudiAIWebSocketSubject {
    return webSocket({
      url,
      openObserver: {
        next: () => {
          // console.debug('[TrudiAIWebSocketService] connected');
          this._ping();
          this.joinThread();
        }
      },
      closeObserver: {
        next: () => {
          // console.debug('[TrudiAIWebSocketService] disconnected');
        }
      },
      closingObserver: {
        next: () => {
          // console.debug('[TrudiAIWebSocketService] closing');
        }
      }
    });
  }

  private _disconnect() {
    this._websocket$?.unsubscribe();
    this._websocket$ = undefined;
  }

  /**
   * send message to server
   * @param message
   */
  private _sendMessage(message: TrudiAIWebSocketResponse): void {
    this._websocket$?.next(message);
  }

  /**
   * ping server
   */
  private _ping(): void {
    this.zone.runOutsideAngular(() => {
      this._stopPing();
      this._pingIntervalId = setInterval(() => {
        this._sendMessage({
          action: TrudiAIWebSocketAction.PING,
          thread_id: this._threadId,
          // TODO: sender should be dynamic
          sender: 'human',
          payload: ''
        });
      }, this._pingInterval);
    });
  }

  private _stopPing(): void {
    if (this._pingIntervalId) {
      clearInterval(this._pingIntervalId);
    }
  }

  private setSocketUrl(companyId: string, token: string): void {
    this._socketUrl = encodeURI(
      `${aiWebSocketUrl}?authorization=Bearer ${token}&company-id=${companyId}`
    );
  }
}
