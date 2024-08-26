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
import { UserAgentApiService } from '@/app/user/services/user-agent-api.service';
import { ParamsTenantsLandlords } from '@/app/user/utils/user.type';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { TrudiIndexedDBStorageKey } from '@core';
import { IDBIUsersByProperty } from '@core/store/contact-page/tenants-owners/type';
import { IAgentUserProperties } from '@/app/user/list-property-contact-view/model/main';
import { Store } from '@ngrx/store';
import { tenantsOwnersPageActions } from '@core/store/contact-page/tenants-owners/property-tree/actions/tenants-owners-pt-page.actions';
import { tenantsOwnersActions } from '@core/store/contact-page/tenants-owners/property-tree/actions/tenants-owners-pt.actions';
import { tenantsOwnersApiActions } from '@core/store/contact-page/tenants-owners/property-tree/actions/tenants-owners-pt-api.actions';
import { selectPayloadTenantsOwners } from '@core/store/contact-page/tenants-owners/property-tree/selectors/tenants-owners-pt.selectors';
import { TenantOwnerPTMemoryCacheService } from '@core/store/contact-page/tenants-owners/property-tree/services/tenant-owner-pt-memory-cache.service';
import { ContactPageCacheBase } from '@core/store/contact-page/contact-base/contact-page-cache-base';
import { CompanyService } from '@services/company.service';

@Injectable()
export class TenantsOwnersEffectsPT extends ContactPageCacheBase {
  public firstInitial = true;

  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(tenantsOwnersPageActions.payloadChange),
      switchMap(({ payload }) =>
        this.companyService.getCurrentCompanyId().pipe(
          switchMap((companyId) => {
            const serverData$ = new Subject<void>();

            const handleGetCacheSuccess = (cache: IAgentUserProperties[]) =>
              this.store.dispatch(
                tenantsOwnersActions.getCacheSuccess({
                  data: cache
                })
              );

            const memoryCache = this.tenantOwnerPTMMemoryService.get(
              this.composeCacheKey(payload, companyId)
            );

            if (memoryCache) {
              handleGetCacheSuccess(memoryCache);
            } else {
              const cacheData$ =
                this.shouldCacheTenantsOwners(payload) && this.firstInitial
                  ? this.getCacheTenantsOwners().pipe(
                      // if data come from server first, then cache data will be ignored
                      takeUntil(serverData$),
                      take(1),
                      tap((data) => {
                        this.store.dispatch(
                          tenantsOwnersActions.getCacheSuccess({ data })
                        );
                        this.firstInitial = false;
                      })
                    )
                  : EMPTY;
              cacheData$.subscribe();
            }

            return this.userAgentApiService
              .getListTenantsOwnersPT(payload)
              .pipe(
                tap((response) => {
                  serverData$.next();
                  this.handleCacheTenantsOwners({
                    data: response,
                    payload
                  });
                }),
                map((response) => {
                  this.tenantOwnerPTMMemoryService.set(
                    this.composeCacheKey(payload, companyId),
                    response.propertyContacts
                  );
                  return tenantsOwnersApiActions.getTenantsOwnersSuccess({
                    data: response,
                    payload
                  });
                }),
                catchError((error) =>
                  of(tenantsOwnersApiActions.getTenantsOwnersFailure({ error }))
                )
              );
          })
        )
      )
    )
  );

  readonly exitPage$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(tenantsOwnersPageActions.exitPage),
        tap(() => {
          this.firstInitial = true;
        })
      ),
    { dispatch: false }
  );

  readonly nextPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(tenantsOwnersPageActions.nextPage),
      concatLatestFrom(() => this.store.select(selectPayloadTenantsOwners)),
      switchMap(([_, payload]) => {
        return this.userAgentApiService.getListTenantsOwnersPT(payload).pipe(
          map((response) => {
            return tenantsOwnersApiActions.getNewPageTenantsOwners({
              tenantsOwners: response.propertyContacts
            });
          }),
          catchError((error) =>
            of(tenantsOwnersApiActions.getTenantsOwnersFailure({ error }))
          )
        );
      })
    )
  );

  private getCacheTenantsOwners(): Observable<IAgentUserProperties[]> {
    return this.indexedDBService.getAll(
      TrudiIndexedDBStorageKey.TENANTS_OWNERS_PT
    );
  }

  constructor(
    private readonly action$: Actions,
    private readonly userAgentApiService: UserAgentApiService,
    private readonly zone: NgZone,
    private indexedDBService: NgxIndexedDBService,
    private store: Store,
    private tenantOwnerPTMMemoryService: TenantOwnerPTMemoryCacheService,
    protected override companyService: CompanyService
  ) {
    super(companyService);
  }

  private handleCacheTenantsOwners(response: {
    data: IDBIUsersByProperty;
    payload: ParamsTenantsLandlords;
  }) {
    this.scheduleLowPriorityTask(() => {
      if (this.shouldCacheTenantsOwners(response.payload)) {
        this.syncServerAndLocalData(response.data, response.payload);
      }
    });
  }

  private syncServerAndLocalData(
    data: IDBIUsersByProperty,
    payload: ParamsTenantsLandlords
  ) {
    if (!data.propertyContacts.length) return;
    this.getCurrentCompanyId().subscribe((companyId) => {
      const { propertyContacts } = data || {};

      const mapPropertyContacts = propertyContacts.map((property, index) => {
        return {
          ...property,
          order: +payload.page + 1 + index,
          companyId
        };
      });
      const clearData$ = this.indexedDBService.clear(
        TrudiIndexedDBStorageKey.TENANTS_OWNERS_PT
      );
      const addData$ = of(null).pipe(
        concatMap(() =>
          this.indexedDBService.bulkAdd(
            TrudiIndexedDBStorageKey.TENANTS_OWNERS_PT,
            mapPropertyContacts
          )
        )
      );
      clearData$.pipe(concatMap(() => addData$)).subscribe();
    });
  }

  private shouldCacheTenantsOwners(payload: ParamsTenantsLandlords) {
    if (Number(payload.page) !== 0) return false;
    if (payload.search?.length) return false;
    return true;
  }
}
