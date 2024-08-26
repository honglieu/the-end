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
import { tenantProspectApiActions } from '@core/store/contact-page/tenant-prospect/actions/tenant-prospect-api.actions';
import { tenantProspectActions } from '@core/store/contact-page/tenant-prospect/actions/tenant-prospect.actions';
import { tenantProspectPageActions } from '@core/store/contact-page/tenant-prospect/actions/tenant-prospect-page.actions';
import { UserAgentApiService } from '@/app/user/services/user-agent-api.service';
import { selectMessagePayloadTenantProspect } from '@core/store/contact-page/tenant-prospect/selectors/tenant-prospect.selectors';
import { IDBTenantProspect } from '@core/store/contact-page/tenant-prospect/type';
import { IAgency } from '@shared/types/users-by-property.interface';
import { TenantProspectMemoryCacheService } from '@core/store/contact-page/tenant-prospect/services/tenant-prospect-memory-cache.service';
import { ContactPageCacheBase } from '@core/store/contact-page/contact-base/contact-page-cache-base';
import { CompanyService } from '@services/company.service';

@Injectable()
export class TenantProspectEffects extends ContactPageCacheBase {
  public firstInitial = true;
  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(tenantProspectPageActions.payloadChange),
      switchMap(({ payload }) =>
        this.companyService.getCurrentCompanyId().pipe(
          switchMap((companyId) => {
            const serverData$ = new Subject<void>();

            const handleGetCacheSuccess = (cache: Array<IAgency>) =>
              this.store.dispatch(
                tenantProspectActions.getCacheSuccess({
                  data: cache
                })
              );

            const memoryCache = this.tenantProspectMemoryCacheService.get(
              this.composeCacheKey(payload, companyId)
            );

            if (memoryCache) {
              handleGetCacheSuccess(memoryCache);
            } else {
              const cacheData$ =
                this.shouldCacheTenantProspect(payload) && this.firstInitial
                  ? this.getCacheTenantProspect().pipe(
                      // if data come from server first, then cache data will be ignored
                      takeUntil(serverData$),
                      take(1),
                      tap((data) => {
                        this.store.dispatch(
                          tenantProspectActions.getCacheSuccess({ data })
                        );
                        this.firstInitial = false;
                      })
                    )
                  : EMPTY;
              cacheData$.subscribe();
            }

            return this.getListTenantProspect(payload).pipe(
              tap((response) => {
                serverData$.next();
                this.handleCacheTenantProspect({
                  data: response,
                  payload
                });
              }),
              map((response) => {
                const companyId = this.companyService.currentCompanyId() || '';
                this.tenantProspectMemoryCacheService.set(
                  this.composeCacheKey(payload, companyId),
                  response.listAgencies
                );
                return tenantProspectApiActions.getTenantProspectSuccess({
                  data: response,
                  payload
                });
              }),
              catchError((error) =>
                of(tenantProspectApiActions.getTenantProspectFailure({ error }))
              )
            );
          })
        )
      )
    )
  );

  readonly nextPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(tenantProspectPageActions.nextPage),
      concatLatestFrom(() =>
        this.store.select(selectMessagePayloadTenantProspect)
      ),
      switchMap(([_, payload]) => {
        return this.getListTenantProspect(payload).pipe(
          map((response) => {
            return tenantProspectApiActions.getNewPageSuccess({
              tenantProspect: response.listAgencies
            });
          }),
          catchError((error) =>
            of(tenantProspectApiActions.getTenantProspectFailure({ error }))
          )
        );
      })
    )
  );

  readonly exitPage$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(tenantProspectPageActions.exitPage),
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
    private tenantProspectMemoryCacheService: TenantProspectMemoryCacheService,
    protected override companyService: CompanyService
  ) {
    super(companyService);
  }

  private getListTenantProspect(payload) {
    const { page, size, crmStatus, search } = payload;
    return this.userAgentApiService.getListTenantProspect(
      page,
      size,
      crmStatus,
      search
    );
  }

  private handleCacheTenantProspect(response: {
    data: IDBTenantProspect;
    payload: ParamsTenantLandlordsProspect;
  }) {
    this.scheduleLowPriorityTask(() => {
      if (this.shouldCacheTenantProspect(response.payload)) {
        this.syncServerAndLocalData(response.data, response.payload);
      }
    });
  }

  private syncServerAndLocalData(
    data: IDBTenantProspect,
    payload: ParamsTenantLandlordsProspect
  ) {
    if (!data.listAgencies.length) return;
    this.getCurrentCompanyId().subscribe((companyId) => {
      const { listAgencies } = data || {};

      const maplistAgencies = listAgencies.map((agency) => {
        return {
          ...agency,
          companyId
        };
      });
      const clearData$ = this.indexedDBService.clear(
        TrudiIndexedDBStorageKey.TENANT_PROSPECT
      );
      const addData$ = of(null).pipe(
        concatMap(() =>
          this.indexedDBService.bulkAdd(
            TrudiIndexedDBStorageKey.TENANT_PROSPECT,
            maplistAgencies
          )
        )
      );
      clearData$.pipe(concatMap(() => addData$)).subscribe();
    });
  }

  private getCacheTenantProspect(): Observable<Array<IAgency>> {
    return this.indexedDBService.getAll(
      TrudiIndexedDBStorageKey.TENANT_PROSPECT
    );
  }

  private shouldCacheTenantProspect(payload: ParamsTenantLandlordsProspect) {
    if (payload.page !== 0) return false;
    if (payload.search?.length) return false;
    return true;
  }
}
