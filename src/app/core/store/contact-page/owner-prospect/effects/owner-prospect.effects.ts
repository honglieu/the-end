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
import { ParamsTenantLandlordsProspect } from '@/app/user/utils/user.type';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Store } from '@ngrx/store';
import { TrudiIndexedDBStorageKey } from '@core';
import { ownerProspectPageActions } from '@core/store/contact-page/owner-prospect/actions/owner-prospect-page.actions';
import { UserAgentApiService } from '@/app/user/services/user-agent-api.service';
import { selectMessagePayloadOwnerProspect } from '@core/store/contact-page/owner-prospect/selectors/owner-prospect.selectors';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { ownerProspectApiActions } from '@core/store/contact-page/owner-prospect/actions/owner-prospect-api.actions';
import { ownerProspectActions } from '@core/store/contact-page/owner-prospect/actions/owner-prospect.actions';
import { IDBOwnerProspect } from '@core/store/contact-page/owner-prospect/type';
import { OwnerProspectMemoryCacheService } from '@core/store/contact-page/owner-prospect/services/owner-prospect-memory-cache.service';
import { ContactPageCacheBase } from '@core/store/contact-page/contact-base/contact-page-cache-base';
import { CompanyService } from '@services/company.service';

@Injectable()
export class OwnerProspectEffects extends ContactPageCacheBase {
  public firstInitial = true;
  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(ownerProspectPageActions.payloadChange),
      switchMap(({ payload }) =>
        this.companyService.getCurrentCompanyId().pipe(
          switchMap((companyId) => {
            const serverData$ = new Subject<void>();

            const handleGetCacheSuccess = (cache: Array<UserProperty>) =>
              this.store.dispatch(
                ownerProspectActions.getCacheSuccess({
                  data: cache
                })
              );
            const memoryCache = this.ownerProspectMemoryCacheService.get(
              this.composeCacheKey(payload, companyId)
            );

            if (memoryCache) {
              handleGetCacheSuccess(memoryCache);
            } else {
              const cacheData$ =
                this.shouldCacheOwnerProspect(payload) && this.firstInitial
                  ? this.getCacheOwnerProspect().pipe(
                      // if data come from server first, then cache data will be ignored
                      takeUntil(serverData$),
                      take(1),
                      tap((data) => {
                        this.store.dispatch(
                          ownerProspectActions.getCacheSuccess({ data })
                        );
                        this.firstInitial = false;
                      })
                    )
                  : EMPTY;
              cacheData$.subscribe();
            }

            return this.getListOwnerProspect(payload).pipe(
              tap((response) => {
                serverData$.next();
                this.handleCacheOwnerProspect({
                  data: response,
                  payload
                });
              }),
              map((response) => {
                this.ownerProspectMemoryCacheService.set(
                  this.composeCacheKey(payload, companyId),
                  response.userProperties
                );
                return ownerProspectApiActions.getOwnerProspectSuccess({
                  data: response,
                  payload
                });
              }),
              catchError((error) =>
                of(ownerProspectApiActions.getOwnerProspectFailure({ error }))
              )
            );
          })
        )
      )
    )
  );

  readonly nextPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(ownerProspectPageActions.nextPage),
      concatLatestFrom(() =>
        this.store.select(selectMessagePayloadOwnerProspect)
      ),
      switchMap(([_, payload]) => {
        return this.getListOwnerProspect(payload).pipe(
          map((response) => {
            return ownerProspectApiActions.getNewPageSuccess({
              ownerProspect: response.userProperties
            });
          }),
          catchError((error) =>
            of(ownerProspectApiActions.getOwnerProspectFailure({ error }))
          )
        );
      })
    )
  );

  readonly exitPage$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(ownerProspectPageActions.exitPage),
        tap(() => {
          this.firstInitial = true;
        })
      ),
    { dispatch: false }
  );

  constructor(
    private readonly action$: Actions,
    private readonly zone: NgZone,
    private indexedDBService: NgxIndexedDBService,
    private store: Store,
    private userAgentApiService: UserAgentApiService,
    private ownerProspectMemoryCacheService: OwnerProspectMemoryCacheService,
    protected override companyService: CompanyService
  ) {
    super(companyService);
  }
  private getListOwnerProspect(payload) {
    const { page, size, crmStatus, search } = payload;
    return this.userAgentApiService.getOwnerProspect(
      page,
      size,
      crmStatus,
      search
    );
  }

  private handleCacheOwnerProspect(response: {
    data: IDBOwnerProspect;
    payload: ParamsTenantLandlordsProspect;
  }) {
    this.scheduleLowPriorityTask(() => {
      if (this.shouldCacheOwnerProspect(response.payload)) {
        this.syncServerAndLocalData(response.data, response.payload);
      }
    });
  }

  private syncServerAndLocalData(
    data: IDBOwnerProspect,
    payload: ParamsTenantLandlordsProspect
  ) {
    if (!data.userProperties.length) return;
    this.getCurrentCompanyId().subscribe((companyId) => {
      const { userProperties } = data || {};
      const mapUserProperties = userProperties.map((property) => {
        return {
          ...property,
          companyId
        };
      });
      const clearData$ = this.indexedDBService.clear(
        TrudiIndexedDBStorageKey.OWNER_PROSPECT
      );
      const addData$ = of(null).pipe(
        concatMap(() =>
          this.indexedDBService.bulkAdd(
            TrudiIndexedDBStorageKey.OWNER_PROSPECT,

            mapUserProperties
          )
        )
      );
      clearData$.pipe(concatMap(() => addData$)).subscribe();
    });
  }

  private getCacheOwnerProspect(): Observable<Array<UserProperty>> {
    return this.indexedDBService.getAll(
      TrudiIndexedDBStorageKey.OWNER_PROSPECT
    );
  }

  private shouldCacheOwnerProspect(payload: ParamsTenantLandlordsProspect) {
    if (payload.page !== 0) return false;
    if (payload.search?.length) return false;
    return true;
  }
}
