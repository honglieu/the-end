import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AsyncSubject,
  catchError,
  first,
  forkJoin,
  map,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import { TenantApiService } from './api/tenant-api.service';
import { TenantFormMasterService } from './forms/tenant-form-master.service';
import { TenantOptionsStateService } from './state/tenant-options-state.service';
import { TenantStateService } from './state/tenant-state.service';

@Component({
  selector: 'rent-manager-tenant',
  templateUrl: './rent-manager-tenant.component.html',
  styleUrls: ['./rent-manager-tenant.component.scss']
})
export class RentManagerTenantComponent implements OnInit, OnDestroy {
  private _destroy$ = new AsyncSubject<void>();

  constructor(
    private tenantApiService: TenantApiService,
    private tenantOptionsStateService: TenantOptionsStateService,
    private tenantState: TenantStateService,
    private formMasterService: TenantFormMasterService
  ) {}

  ngOnInit(): void {
    this.tenantState.tenant$
      .pipe(
        map((tenant) => tenant?.id),
        first(),
        switchMap((tenantId) => {
          if (!tenantId) return of(null);
          return this.tenantState.syncingForms$.pipe(
            map((forms) => forms.find((f) => f.getRawValue()?.id == tenantId)),
            first()
          );
        })
      )
      .subscribe((form) => {
        if (form) {
          this.formMasterService.initForm(form);
        } else {
          this.formMasterService.initForm();
          this.tenantState.setLoading(true);
          forkJoin([this._getTenantOptions(), this._getFormData()])
            .pipe(takeUntil(this._destroy$))
            .subscribe({
              next: ([options, formData]) => {
                if (!options) return;
                this.tenantOptionsStateService.setOptionsSync(options);
                this.formMasterService.buildForm(options);
                this._patchFormData(formData);
                this.tenantState.setLoading(false);
              }
            });
        }
      });
  }

  private _getTenantOptions() {
    return this.tenantApiService.getNewTenantOptions().pipe(
      catchError(() => {
        this.tenantState.setLoading(false);
        return of(null);
      })
    );
  }

  private _getFormData() {
    const tenantId$ = this.tenantState.tenant$.pipe(
      map((tenant) => tenant?.id)
    );

    return tenantId$.pipe(
      first(),
      switchMap((tenantId) => {
        if (!tenantId) return of(null);
        return this.tenantApiService.getTenant(tenantId).pipe(
          catchError(() => {
            this.tenantState.setLoading(false);
            return of(null);
          }),
          map((response) => {
            this.tenantState.setTenant(response);
            const tenantId = response?.id;
            const data = response?.data || {};
            const {
              firstName,
              lastName,
              contacts,
              addresses = [],
              lease = {},
              deposit = {},
              settings = {},
              recurringCharges = [],
              charges = [],
              userDefinedValues = [],
              subsidyTenants = []
            } = data;
            const formData = {
              id: tenantId,
              info: {
                name: {
                  firstName,
                  lastName
                },
                address: addresses?.map((element) => ({
                  id: element?.id,
                  typeId: element?.addressType?.id,
                  typeName: element?.addressType?.name,
                  address: element?.address,
                  isPrimary: element?.isPrimary
                }))
              },
              lease,
              contacts,
              deposit,
              setting: { ...settings, subsidies: subsidyTenants },
              charges: {
                recurring: recurringCharges,
                oneTime: charges
              },
              userFields: userDefinedValues
            };
            return {
              ...formData,
              syncDate: response?.syncDate,
              syncStatus: response?.syncStatus
            };
          })
        );
      })
    );
  }

  private _patchFormData(data) {
    this.formMasterService.patchFormData(data);
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
    this.tenantState.resetData();
  }
}
