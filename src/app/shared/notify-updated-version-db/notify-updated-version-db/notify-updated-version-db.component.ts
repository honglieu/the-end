import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { ISocketVersionUpdateRequest } from '@shared/types/socket.interface';
import {
  distinctUntilChanged,
  firstValueFrom,
  lastValueFrom,
  retry,
  Subject,
  Subscription,
  take,
  takeUntil,
  timeout
} from 'rxjs';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedService } from '@services/shared.service';
import { UserService } from '@services/user.service';
import { SocketType } from '@shared/enum';
import { NewVersionCheckerService } from '@services/new-version-checker.service';
import { AppVersionEvent } from '@shared/enum/version-update.enum';
import * as Sentry from '@sentry/angular-ivy';
import { ToastrService } from 'ngx-toastr';
import { VersionEvent } from '@angular/service-worker';

const initialDataVersionUpdateRequest: ISocketVersionUpdateRequest = {
  type: SocketType.versionUpdateRequest,
  buildDate: '',
  commitHash: '',
  deleteDB: false
};

@Component({
  selector: 'notify-updated-version-db',
  templateUrl: './notify-updated-version-db.component.html',
  styleUrls: ['./notify-updated-version-db.component.scss']
})
export class NotifyUpdatedVersionDbComponent implements OnInit, OnDestroy {
  @ViewChild('popupNotifyNewVersionElement', { static: false })
  popupNotifyNewVersionElement: ElementRef;
  public isShowNotifyModal: boolean = false;
  public dataVersionUpdateRequest: ISocketVersionUpdateRequest =
    initialDataVersionUpdateRequest;
  private unsubscribe = new Subject<void>();

  readonly currentCommitHash: string = '{COMMIT_HASH}';
  readonly currentBuildDate: string = '{BUILD_DATE}';
  private versionUpdateSubscription: Subscription;
  private currentVersionEvent: string;

  public installingNewVersion: boolean = false;

  constructor(
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly websocketService: RxWebsocketService,
    private sharedService: SharedService,
    private userService: UserService,
    private newVersionCheckerService: NewVersionCheckerService,
    private toastService: ToastrService
  ) {}

  ngOnInit() {
    this.checkForUpdate();
  }

  checkForUpdate(): void {
    this.newVersionCheckerService.versionUpdate$
      .pipe(takeUntil(this.unsubscribe), timeout(30000))
      .subscribe({
        next: (event) => {
          this.handleVersionUpdateEvent(event);
        },
        error: () => {
          this.subscribeSocketVersionUpdateRequest();
        }
      });
  }

  private handleVersionUpdateEvent(event: VersionEvent) {
    try {
      this.currentVersionEvent = event.type;
      switch (event.type) {
        case AppVersionEvent.VERSION_DETECTED:
          this.handleLogDebug(
            `Downloading new app version: ${event.version.hash}`
          );
          break;
        case AppVersionEvent.VERSION_READY:
          this.isShowNotifyModal = true;
          this.setDataShowPopup();
          this.handleLogDebug(
            `Current app version: ${event.currentVersion.hash}. New app version ready for use: ${event.latestVersion.hash}`
          );
          break;
        case AppVersionEvent.VERSION_INSTALLATION_FAILED:
          this.handleLogDebug(
            `Version install failed: ${JSON.stringify(event ?? {})}`
          );
          this.subscribeSocketVersionUpdateRequest();
          break;
        case AppVersionEvent.NO_NEW_VERSION_DETECTED:
          this.subscribeSocketVersionUpdateRequest();
          break;
      }
    } catch (error) {
      this.subscribeSocketVersionUpdateRequest();
      Sentry.captureException(`[APP_VERSION] handle version event error`, {
        extra: error,
        level: 'error'
      });
    }
  }

  subscribeSocketVersionUpdateRequest() {
    this.versionUpdateSubscription?.unsubscribe();
    this.versionUpdateSubscription =
      this.websocketService.onSocketVersionUpdateRequest
        .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res) {
            this.dataVersionUpdateRequest = res;
            const { commitHash } = this.dataVersionUpdateRequest;
            const isReload = commitHash !== this.currentCommitHash;
            this.isShowNotifyModal = isReload;
            this.handleLogDebug(
              `New commit hash: ${commitHash}. Current commit hash: ${this.currentCommitHash}`
            );
            this.setDataShowPopup();
          }
        });
  }

  async handleReloadBtn() {
    if (this.installingNewVersion) {
      return;
    }

    try {
      this.installingNewVersion = true;
      const updateTasks = [];
      const deleteDB = this.dataVersionUpdateRequest?.deleteDB;
      this.handleLogDebug(`Handle install new version (deleteDB: ${deleteDB})`);

      if (
        this.currentVersionEvent &&
        this.currentVersionEvent !== AppVersionEvent.VERSION_READY
      ) {
        updateTasks.push(this.newVersionCheckerService.checkForUpdate());
      }

      if (deleteDB) {
        updateTasks.push(this.deleteIndexedDatabase());
      }

      if (!updateTasks.length) {
        this.handleLogDebug(`No update tasks found`);
        location.reload();
      }

      const result = await Promise.all(updateTasks);
      this.isShowNotifyModal = false;
      this.setDataShowPopup();
      this.handleLogDebug(`Update tasks result: ${JSON.stringify(result)}`);
      location.reload();
    } catch (error) {
      this.handleLogError('Error while updating for new version', error);
      this.toastService.error(
        'Error while updating for new version, please try again.'
      );
    } finally {
      this.installingNewVersion = false;
    }
  }

  handleNotifyLaterBtn() {
    firstValueFrom(this.userService.notifyLaterApi());
    this.isShowNotifyModal = false;
    this.setDataShowPopup();
  }

  private async deleteIndexedDatabase(): Promise<boolean> {
    return await lastValueFrom(
      this.indexedDBService
        .deleteDatabase()
        .pipe(take(1), retry({ count: 2, delay: 1000 }))
    )
      .then(() => {
        this.handleLogDebug('IndexedDB deleted');
        return true;
      })
      .catch((error) => {
        this.handleLogError('Error while deleting IndexedDB', error);
        return false;
      });
  }

  private setDataShowPopup() {
    const popupHeight = 272;
    const dataShowPopupNotifyNewVersion = {
      isShowPopup: this.isShowNotifyModal,
      heighPopup: popupHeight
    };
    this.sharedService.setShowPopupNotifyNewVersion(
      dataShowPopupNotifyNewVersion
    );
  }

  private handleLogDebug(message: string) {
    setTimeout(() => {
      const logMessage = `[APP_VERSION] ${message}. Current Event: ${this.currentVersionEvent}. Current commit hash: ${this.currentCommitHash}`;
      console.debug(logMessage);
      Sentry.captureMessage(logMessage, {
        level: 'debug'
      });
    }, 0);
  }

  private handleLogError(message: string, error: Record<string, unknown>) {
    setTimeout(() => {
      const errorMessage = `[APP_VERSION] ${message}`;
      console.error(errorMessage, error);
      Sentry.captureException(errorMessage, {
        extra: error,
        level: 'error'
      });
    }, 0);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
