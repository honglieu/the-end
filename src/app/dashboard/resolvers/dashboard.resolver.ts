import { TrudiIndexedDBStorageKey } from '@core';
import { SplashScreenService } from '@/app/splash-screen/splash-screen.service';
import { Injectable, NgZone } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import {
  Observable,
  forkJoin,
  lastValueFrom,
  catchError,
  of,
  map,
  retry
} from 'rxjs';
import { DashboardSecondaryDataService } from './secondary/dashboard-secondary-data.service';
import { TaskItem } from '@shared/types/task.interface';

@Injectable()
export class DashboardResolver {
  constructor(
    private readonly secondaryDataService: DashboardSecondaryDataService,
    private readonly splashScreenService: SplashScreenService,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly zone: NgZone
  ) {}

  resolve(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) {
    this.splashScreenService.setVisible(true);
    const turnOffSplashScreen = (timer: number) => {
      setTimeout(() => {
        this.splashScreenService.setVisible(false);
      }, timer);
    };

    // TODO: handle load primary data: company, mailbox,...
    this.secondaryDataService
      .loadSecondaryData()
      .pipe(
        retry({
          count: 2,
          delay: 500
        })
      )
      .subscribe({
        next: (data) => {
          this.saveDataToIndexedDB(data);
        },
        complete: () => {
          // wait for child components to finish rendering
          turnOffSplashScreen(500);
        },
        error: () => turnOffSplashScreen(0)
      });
    return true;
  }

  private clearIndexedDBData(): Observable<boolean> {
    const tablesToClear = [
      TrudiIndexedDBStorageKey.MESSAGE,
      TrudiIndexedDBStorageKey.TASK_GROUP,
      TrudiIndexedDBStorageKey.TASK_LIST,
      TrudiIndexedDBStorageKey.TENANTS_OWNERS_RM,
      TrudiIndexedDBStorageKey.TENANTS_OWNERS_PT,
      TrudiIndexedDBStorageKey.SUPPLIER,
      TrudiIndexedDBStorageKey.OTHER_CONTACT,
      TrudiIndexedDBStorageKey.TENANT_PROSPECT,
      TrudiIndexedDBStorageKey.OWNER_PROSPECT,
      TrudiIndexedDBStorageKey.APP_MESSAGE
    ];
    const tasks: Observable<boolean>[] = [];
    for (const table of tablesToClear) {
      tasks.push(this.indexedDBService.clear(table));
    }
    return forkJoin(tasks).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  private saveDataToIndexedDB(data) {
    const { messages = [], taskFolder } = data ?? {};
    this.zone.runOutsideAngular(async () => {
      const clearResult = await lastValueFrom(this.clearIndexedDBData());
      if (!clearResult) return;
      this.handleCacheMessage(messages, TrudiIndexedDBStorageKey.MESSAGE);
      this.handleCacheMessage(messages, TrudiIndexedDBStorageKey.APP_MESSAGE);
      this.handleCacheTaskFolder(taskFolder);
    });
  }

  private handleCacheMessage(
    messages: TaskItem[],
    storageKey: TrudiIndexedDBStorageKey
  ) {
    if (!messages?.length) return;
    for (const message of messages) {
      // the method `bulkAdd` not working as expected, so we use `add` instead
      this.indexedDBService
        .add(storageKey, message)
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }

  private handleCacheTaskFolder(taskFolders) {
    if (!taskFolders?.length) return;
    for (const taskFolder of taskFolders) {
      // the method `bulkAdd` not working as expected, so we use `add` instead
      this.indexedDBService
        .add(TrudiIndexedDBStorageKey.TASK_FOLDER, taskFolder)
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }
}
