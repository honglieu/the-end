import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  Efrequency,
  WEEKLY_CHECK
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { TenantApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/api/tenant-api.service';
import { PopupSyncTenantService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/popup-sync-tenant/popup-sync-tenant.service';
import { TenantStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/tenant-state.service';
import { PropertiesService } from '@/app/services/properties.service';

@Component({
  selector: 'widget-tenant',
  templateUrl: './widget-tenant.component.html',
  styleUrls: ['./widget-tenant.component.scss']
})
export class WidgetTenantComponent implements OnInit {
  destroyed$ = new Subject();
  groupTitle = 'NEW TENANT';
  constructor(
    private widgetRMService: WidgetRMService,
    private toastrService: ToastrService,
    private stepService: StepService,
    private popupSyncTenantService: PopupSyncTenantService,
    private tenantApiService: TenantApiService,
    private tenantState: TenantStateService,
    private propertyService: PropertiesService
  ) {}
  public newTenant;
  ngOnInit(): void {
    this.widgetRMService
      .getRMWidgetStateByType(RMWidgetDataField.NEW_TENANT)
      .pipe(takeUntil(this.destroyed$))
      .subscribe((newTenant: any) => {
        this.newTenant = newTenant;
      });
  }

  public retrySync(cardData) {
    const idTenant = cardData?.id;

    const updatedRmTenants = this.widgetRMService.leasing.value.map(
      (rmTenant) => {
        if (rmTenant.id === idTenant) {
          return {
            ...rmTenant,
            syncStatus: ESyncStatus.INPROGRESS
          };
        }
        return rmTenant;
      }
    );

    this.widgetRMService.setRMWidgetStateByType(
      RMWidgetDataField.NEW_TENANT,
      'UPDATE',
      updatedRmTenants
    );

    this.tenantApiService.retrySyncNewTenant(idTenant).subscribe({
      next: (res) => {
        const { errorMessSync, syncStatus } = res || {};
        if (errorMessSync) {
          this.toastrService.error(errorMessSync);
        }
        if (syncStatus === ESyncStatus.COMPLETED) {
          this._updateListOfTenant();
        }
        this.popupSyncTenantService.updateTenantDetailWidget(
          {
            ...res,
            firstTimeSyncSuccess: syncStatus !== ESyncStatus.FAILED
          },
          idTenant
        );
      },
      error: (err) => {
        this.toastrService.error(err?.message);
      }
    });
  }

  public removeWidget(cardData) {
    const idTenant = cardData?.id;

    if (idTenant) {
      this.tenantApiService.removeSyncNewTenant(idTenant).subscribe({
        next: (res) => {
          const resUpdated = Object.keys(res).length > 1 ? res : null;

          this._updateListOfTenant();
          this.popupSyncTenantService.updateTenantDetailWidget(
            resUpdated,
            idTenant
          );
        },
        error: (error) => {
          this.toastrService.error(error?.message);
        }
      });
    } else {
      this.widgetRMService.setRMWidgetStateByType(
        RMWidgetDataField.NEW_TENANT,
        'REMOVE',
        []
      );
    }
  }

  private _updateListOfTenant() {
    const propertyId = this.propertyService.currentPropertyId.getValue();
    this.propertyService.getPeople(propertyId);
  }

  public openNewTenantForm(cardData) {
    this.tenantState.setTenant(cardData);
    this.widgetRMService.setPopupWidgetState(ERentManagerType.NEW_TENANT);
    this.stepService.setCurrentRMStep(null);
  }
}

@Pipe({ name: 'dueDay' })
export class FormatDueDayPipe implements PipeTransform {
  constructor() {}
  transform(rentDueDay: string, rentPeriod: string): string {
    if (rentPeriod?.toUpperCase() !== Efrequency.WEEKLY) return rentDueDay;
    return WEEKLY_CHECK[rentDueDay];
  }
}
