import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ElectronService } from './electron.service';
import { conversations } from 'src/environments/environment';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import firebase from 'firebase/compat/app';
import {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED
} from 'src/helpers/electron/constants';
import { firebaseConfig } from 'src/environments/environment';
import { NotificationService } from './notification.service';
import { ActivatedRoute } from '@angular/router';
import { CompanyService } from './company.service';
interface IPayload {
  notification: {
    body: string;
    title: string;
    icon: string;
    clickAction: string;
  };
  data: any;
}

@Injectable()
export class FirebaseService {
  public electronAppToken = new BehaviorSubject<any>(null);
  public hasElectronListener = false;
  public notificationId$: BehaviorSubject<any> = new BehaviorSubject(null);
  public companyId: string | null = null;

  constructor(
    private apiService: ApiService,
    private electronService: ElectronService,
    private notificationService: NotificationService,
    private companyService: CompanyService,
    private activatedRoute: ActivatedRoute,
    private angularFireMessaging: AngularFireMessaging
  ) {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params && params['notificationId']) {
        this.onHandleReadNotification(params['notificationId']);
      }
    });
    if (this.electronService.checkElectronApp()) {
      this.electronService.ipcRenderer.on(
        NOTIFICATION_SERVICE_STARTED,
        (_, token) => {
          this.electronAppToken.next(token);
          this.registerPushTokenRequest(token).subscribe();
        }
      );
    }
    this.companyService.getCurrentCompanyId().subscribe((companyId) => {
      this.companyId = companyId;
    });
  }

  requestPermission() {
    if (this.electronService.checkElectronApp()) {
      this.electronService.ipcRenderer.send(
        START_NOTIFICATION_SERVICE,
        firebaseConfig.messagingSenderId
      );
    } else {
      this.angularFireMessaging.requestToken.subscribe((token) => {
        return token && this.registerPushTokenRequest(token).subscribe();
      });
    }
  }

  onHandleReadNotification(notificationId: string) {
    this.notificationId$.next(notificationId);
    this.notificationService
      .markNotificationAsRead(notificationId)
      .subscribe((res) =>
        this.notificationService.removeNotiFromUnseenList(notificationId)
      );
  }

  receiveMessage() {
    if (this.electronService.checkElectronApp()) return;

    this.angularFireMessaging.messages.subscribe(
      (payload: firebase.messaging.MessagePayload) => {
        if (document.hidden) return;

        const { data } = payload;
        const { title, body, companyId, click_action } = data;

        if (!title || !body || !companyId || companyId !== this.companyId)
          return;

        const options = {
          body,
          vibrate: [300, 100, 400],
          data: {
            click_action
          }
        };

        Notification.requestPermission().then((permission) => {
          if (permission !== 'granted') return;
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            const firebaseSW = registrations.find((reg) =>
              reg.active?.scriptURL.includes('firebase-messaging-sw.js')
            );
            if (!firebaseSW) return;

            firebaseSW.showNotification(title, options);
          });
        });
      }
    );
  }

  unregisterPushToken() {
    if (this.electronService.checkElectronApp()) {
      return this.electronAppToken.pipe(
        take(1),
        switchMap((token) => this.unregisterPushTokenRequest(token)),
        catchError(() => {
          return of(null);
        })
      );
    } else {
      return this.angularFireMessaging.getToken.pipe(
        take(1),
        switchMap(
          async (token) => token && this.unregisterPushTokenRequest(token)
        ),
        catchError((err) => {
          return of(null);
        })
      );
    }
  }

  private registerPushTokenRequest(token: string) {
    const platform = this.electronService.checkElectronApp()
      ? this.electronService.ipcRenderer.detectOS()
      : 'BROWSER';

    return this.apiService.postAPI(conversations, 'register-token', {
      token,
      platform
    });
  }

  private unregisterPushTokenRequest(token: string) {
    const platform = this.electronService.ipcRenderer.detectOS();
    return this.apiService.postAPI(conversations, 'delete-token', {
      token,
      platform
    });
  }
}
