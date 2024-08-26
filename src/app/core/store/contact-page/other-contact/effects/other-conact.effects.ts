import { Injectable, NgZone } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  concatMap,
  map,
  of,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs';
import { IOtherContactFilter } from '@/app/user/utils/user.type';
import { IDBOtherContact } from '@core/store/contact-page/other-contact/type';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Store } from '@ngrx/store';
import { TrudiIndexedDBStorageKey } from '@core';
import { otherContactPageActions } from '@core/store/contact-page/other-contact/actions/other-contact-page.actions';
import { OtherContact } from '@shared/types/other-contact.interface';
import { otherContactActions } from '@core/store/contact-page/other-contact/actions/other-contact.actions';
import { otherContactApiActions } from '@core/store/contact-page/other-contact/actions/other-contact-api.actions';
import { OtherContactService } from '@services/orther-contact.service';
import { selectMessagePayloadOtherContact } from '@core/store/contact-page/other-contact/selectors/other-contact.selectors';
import { OtherContactMemoryCacheService } from '@core/store/contact-page/other-contact/services/other-contact-memory-cache.service';
import { ContactPageCacheBase } from '@core/store/contact-page/contact-base/contact-page-cache-base';
import { CompanyService } from '@services/company.service';

@Injectable()
export class OtherContactEffects extends ContactPageCacheBase {
  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(otherContactPageActions.payloadChange),
      switchMap(({ payload }) =>
        this.companyService.getCurrentCompanyId().pipe(
          switchMap((companyId) => {
            {
              const serverData$ = new Subject<void>();

              const handleGetCacheSuccess = (cache: Array<OtherContact>) =>
                this.store.dispatch(
                  otherContactActions.getCacheOtherContactSuccess({
                    data: cache
                  })
                );

              const memoryCache = this.otherContactMemmoryCacheService.get(
                this.composeCacheKey(payload, companyId)
              );

              if (memoryCache) {
                handleGetCacheSuccess(memoryCache);
              } else {
                const cacheData$ = this.shouldCacheSupplier(payload)
                  ? this.getCacheOtherContact().pipe(
                      // if data come from server first, then cache data will be ignored
                      takeUntil(serverData$),
                      take(1),
                      tap((data) => {
                        this.store.dispatch(
                          otherContactActions.getCacheOtherContactSuccess({
                            data
                          })
                        );
                      })
                    )
                  : EMPTY;
                cacheData$.subscribe();
              }

              return this.otherContactService.getList(payload).pipe(
                tap((response) => {
                  serverData$.next();
                  this.handleCacheSupplier({
                    data: response,
                    payload
                  });
                }),
                map((response) => {
                  this.otherContactMemmoryCacheService.set(
                    this.composeCacheKey(payload, companyId),
                    response.items
                  );
                  return otherContactApiActions.getOtherContactSuccess({
                    data: response,
                    payload
                  });
                }),
                catchError((error) =>
                  of(otherContactApiActions.getOtherContactFailure({ error }))
                )
              );
            }
          })
        )
      )
    )
  );

  readonly nextPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(otherContactPageActions.nextPage),
      concatLatestFrom(() =>
        this.store.select(selectMessagePayloadOtherContact)
      ),
      switchMap(([_, payload]) => {
        return this.otherContactService.getList(payload).pipe(
          map((response) => {
            return otherContactApiActions.getNewPageOtherContact({
              otherContact: response.items
            });
          }),
          catchError((error) =>
            of(otherContactApiActions.getOtherContactFailure({ error }))
          )
        );
      })
    )
  );

  constructor(
    private readonly action$: Actions,
    private readonly zone: NgZone,
    private indexedDBService: NgxIndexedDBService,
    private store: Store,
    private otherContactService: OtherContactService,
    private otherContactMemmoryCacheService: OtherContactMemoryCacheService,
    protected override companyService: CompanyService
  ) {
    super(companyService);
  }

  private handleCacheSupplier(response: {
    data: IDBOtherContact;
    payload: IOtherContactFilter;
  }) {
    this.scheduleLowPriorityTask(() => {
      if (this.shouldCacheSupplier(response.payload)) {
        this.syncServerAndLocalData(response.data, response.payload);
      }
    });
  }

  private syncServerAndLocalData(
    data: IDBOtherContact,
    payload: IOtherContactFilter
  ) {
    if (!data.items.length) return;
    const { items } = data || {};
    this.getCurrentCompanyId().subscribe((companyId) => {
      const mapItems = items.map((property) => {
        return {
          ...property,
          companyId
        };
      });
      const clearData$ = this.indexedDBService.clear(
        TrudiIndexedDBStorageKey.OTHER_CONTACT
      );
      const addData$ = of(null).pipe(
        concatMap(() =>
          this.indexedDBService.bulkAdd(
            TrudiIndexedDBStorageKey.OTHER_CONTACT,
            mapItems
          )
        )
      );
      clearData$.pipe(concatMap(() => addData$)).subscribe();
    });
  }

  private getCacheOtherContact(): Observable<Array<OtherContact>> {
    return this.indexedDBService.getAll(TrudiIndexedDBStorageKey.OTHER_CONTACT);
  }

  private shouldCacheSupplier(payload: IOtherContactFilter) {
    if (Number(payload.page) !== 0) return false;
    return true;
  }
}
