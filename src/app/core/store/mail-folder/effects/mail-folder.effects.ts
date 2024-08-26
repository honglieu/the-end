import { DashboardApiService } from '@/app/dashboard/services/dashboard-api.service';
import { Injectable, NgZone } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { MailFolderMemoryCacheService } from '@core/store/mail-folder/services/mail-folder.service';
import { mailFolderPageActions } from '@core/store/mail-folder/actions/mail-folder-page.actions';
import {
  Subject,
  catchError,
  lastValueFrom,
  map,
  of,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import {
  MailFolder,
  MailFolderPayloadType
} from '@core/store/mail-folder/types';
import { mailFolderActions } from '@core/store/mail-folder/actions/mail-folder.actions';
import { TrudiIndexedDBStorageKey } from '@core';
import { mailFolderApiActions } from '@core/store/mail-folder/actions/mail-folder-api.actions';
import { IEmailLabelResponse } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { TrudiIndexedDBIndexKey } from '@core';
import { FolderService } from '@/app/dashboard/modules/inbox/services/inbox-folder.service';
import { TrudiEffect } from '@core/store/shared/trudi-effect';

@Injectable()
export class MailFolderEffects extends TrudiEffect {
  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(mailFolderPageActions.payloadChange),
      switchMap(({ payload }) => {
        const { mailBoxId } = payload;
        const serverData$ = new Subject<void>();

        this.handleGetCacheMailFolders(serverData$, mailBoxId);

        //get data from server
        return this.dashboardApiService.combineGetEmailFolders(mailBoxId).pipe(
          tap(() => {
            serverData$.next();
            serverData$.complete();
          }),
          tap((res: IEmailLabelResponse) => {
            res['items'] = this.folderService.mergeFoldersWithUnread(
              res?.['items'] || [],
              []
            );
            this.updateDataOfMailFolderIntoIndexedDB({
              mailFolders: res.items,
              payload
            });
          }),
          map((res: IEmailLabelResponse) =>
            mailFolderApiActions.getMailFolderSuccess({
              mailFolders: res.items,
              payload
            })
          ),
          catchError((error) =>
            of(mailFolderApiActions.getMailFolderFailure({ error }))
          )
        );
      })
    )
  );

  readonly onSetAllMailFolder$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(mailFolderActions.setAllMailFolderToCache),
        tap(({ mailFolders, payload }) => {
          this.scheduleLowPriorityTask(() => {
            this.updateDataOfMailFolderIntoIndexedDB({ mailFolders, payload });
          });
        })
      ),
    { dispatch: false }
  );

  constructor(
    private readonly action$: Actions,
    private readonly store: Store,
    private readonly zone: NgZone,
    private readonly indexedDBService: NgxIndexedDBService,
    private readonly dashboardApiService: DashboardApiService,
    private readonly mailFolderMemoryCacheService: MailFolderMemoryCacheService,
    private readonly folderService: FolderService
  ) {
    super();
  }

  private async updateDataOfMailFolderIntoIndexedDB(response: {
    payload: MailFolderPayloadType;
    mailFolders: MailFolder[];
  }) {
    try {
      const { payload, mailFolders } = response;
      const mailFolderFromCache = await lastValueFrom(
        this.getMailFolderFromCache(payload?.mailBoxId)
      );
      const cacheMailFolderIds = mailFolderFromCache.map((item) => {
        return [item.internalId, payload?.mailBoxId];
      });
      if (cacheMailFolderIds.length) {
        await lastValueFrom(
          this.indexedDBService.bulkDelete(
            TrudiIndexedDBStorageKey.MAIL_FOLDER,
            cacheMailFolderIds
          )
        );
      }
      if (mailFolders.length) {
        for (const mailFolder of mailFolders) {
          this.indexedDBService
            .add(TrudiIndexedDBStorageKey.MAIL_FOLDER, mailFolder)
            .pipe(catchError(() => of(null)))
            .subscribe();
        }
      }

      this.mailFolderMemoryCacheService.set(payload.mailBoxId, mailFolders);
    } catch (error) {
      console.error(error);
    }
  }

  private handleGetCacheMailFolders(
    serverData$: Subject<void>,
    mailBoxId: string
  ) {
    const memoryCache = this.mailFolderMemoryCacheService.get(mailBoxId);

    const handleSetCacheMessages = (mailFolders: MailFolder[]) => {
      return this.store.dispatch(
        mailFolderActions.getCacheSuccess({ mailFolders })
      );
    };

    if (memoryCache) {
      return handleSetCacheMessages(memoryCache);
    }

    this.getMailFolderFromCache(mailBoxId)
      .pipe(
        takeUntil(serverData$),
        tap((mailFolders) => {
          if (!mailFolders.length) return;

          this.store.dispatch(
            mailFolderActions.getCacheSuccess({ mailFolders })
          );
        })
      )
      .subscribe();

    return;
  }

  private getMailFolderFromCache(mailBoxId: string) {
    if (!mailBoxId) return of([]);
    return this.indexedDBService
      .getAllByIndex<MailFolder>(
        TrudiIndexedDBStorageKey.MAIL_FOLDER,
        TrudiIndexedDBIndexKey.MAIL_BOX_ID,
        IDBKeyRange.only(mailBoxId)
      )
      .pipe(catchError(() => of([])));
  }
}
