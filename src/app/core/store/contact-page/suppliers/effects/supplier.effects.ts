import { Injectable, NgZone } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { supplierPageActions } from '@core/store/contact-page/suppliers/actions/supplier-page.actions';
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
import { ParamsSuppliers } from '@/app/user/utils/user.type';
import { IDBISupplier } from '@core/store/contact-page/suppliers/type';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Store } from '@ngrx/store';
import { TrudiIndexedDBStorageKey } from '@core';
import { supplierActions } from '@core/store/contact-page/suppliers/actions/supplier.actions';
import { UserService } from '@services/user.service';
import { supplierApiActions } from '@core/store/contact-page/suppliers/actions/supplier-api.actions';
import { SupplierProperty } from '@shared/types/users-supplier.interface';
import { selectMessagePayloadSupplier } from '@core/store/contact-page/suppliers/selectors/supplier.selectors';
import { SupplierMemoryCacheService } from '@core/store/contact-page/suppliers/services/supplier-memory-cache.service';
import { ContactPageCacheBase } from '@core/store/contact-page/contact-base/contact-page-cache-base';
import { CompanyService } from '@services/company.service';

@Injectable()
export class SupplierEffects extends ContactPageCacheBase {
  public firstInitial = true;
  readonly payloadChange$ = createEffect(() =>
    this.action$.pipe(
      ofType(supplierPageActions.payloadChange),
      switchMap(({ payload }) =>
        this.companyService.getCurrentCompanyId().pipe(
          switchMap((companyId) => {
            const serverData$ = new Subject<void>();

            const handleGetCacheSuccess = (cache: Array<SupplierProperty>) =>
              this.store.dispatch(
                supplierActions.getCacheSuccess({
                  data: cache
                })
              );
            const memoryCache = this.supplierMemoryCacheService.get(
              this.composeCacheKey(payload, companyId)
            );

            if (memoryCache) {
              handleGetCacheSuccess(memoryCache);
            } else {
              const cacheData$ = this.shouldCacheSupplier(payload)
                ? this.getCacheSupplier().pipe(
                    // if data come from server first, then cache data will be ignored
                    takeUntil(serverData$),
                    take(1),
                    tap((data) => {
                      this.store.dispatch(
                        supplierActions.getCacheSuccess({ data })
                      );
                      this.firstInitial = false;
                    })
                  )
                : EMPTY;
              cacheData$.subscribe();
            }

            return this.getListSupplier(payload).pipe(
              tap((response) => {
                serverData$.next();
                this.handleCacheSupplier({
                  data: response,
                  payload
                });
              }),
              map((response) => {
                this.supplierMemoryCacheService.set(
                  this.composeCacheKey(payload, companyId),
                  response.list
                );
                return supplierApiActions.getSupplierSuccess({
                  data: response,
                  payload
                });
              }),
              catchError((error) =>
                of(supplierApiActions.getSupplierFailure({ error }))
              )
            );
          })
        )
      )
    )
  );

  readonly nextPage$ = createEffect(() =>
    this.action$.pipe(
      ofType(supplierPageActions.nextPage),
      concatLatestFrom(() => this.store.select(selectMessagePayloadSupplier)),
      switchMap(([_, payload]) => {
        return this.getListSupplier(payload).pipe(
          map((response) => {
            return supplierApiActions.getNewPageSuccess({
              suppliers: response.list
            });
          }),
          catchError((error) =>
            of(supplierApiActions.getSupplierFailure({ error }))
          )
        );
      })
    )
  );

  readonly exitPage$ = createEffect(
    () =>
      this.action$.pipe(
        ofType(supplierPageActions.exitPage),
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
    private userService: UserService,
    private supplierMemoryCacheService: SupplierMemoryCacheService,
    protected override companyService: CompanyService
  ) {
    super(companyService);
  }

  private getListSupplier(payload) {
    const pageIndex = payload.page.toString().trim();
    const pageSize = '20';
    return this.userService.getListSupplier(
      payload.search,
      pageIndex,
      pageSize,
      false,
      payload.crmStatus,
      true,
      undefined,
      payload.agencyIds
    );
  }

  private handleCacheSupplier(response: {
    data: IDBISupplier;
    payload: ParamsSuppliers;
  }) {
    this.scheduleLowPriorityTask(() => {
      if (this.shouldCacheSupplier(response.payload)) {
        this.syncServerAndLocalData(response.data, response.payload);
      }
    });
  }

  private syncServerAndLocalData(data: IDBISupplier, payload: ParamsSuppliers) {
    if (!data.list.length) return;
    this.getCurrentCompanyId().subscribe((companyId) => {
      const { list } = data || {};
      const mapList = list.map((item) => {
        return {
          ...item,
          companyId
        };
      });
      const clearData$ = this.indexedDBService.clear(
        TrudiIndexedDBStorageKey.SUPPLIER
      );
      const addData$ = of(null).pipe(
        concatMap(() =>
          this.indexedDBService.bulkAdd(
            TrudiIndexedDBStorageKey.SUPPLIER,
            mapList
          )
        )
      );
      clearData$.pipe(concatMap(() => addData$)).subscribe();
    });
  }

  private getCacheSupplier(): Observable<Array<SupplierProperty>> {
    return this.indexedDBService.getAll(TrudiIndexedDBStorageKey.SUPPLIER);
  }

  private shouldCacheSupplier(payload: ParamsSuppliers) {
    if (payload.page !== 0) return false;
    if (payload.search?.length) return false;
    return true;
  }
}
