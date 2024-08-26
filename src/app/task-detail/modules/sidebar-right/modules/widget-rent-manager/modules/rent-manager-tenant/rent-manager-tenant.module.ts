import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TenantApiService } from './api/tenant-api.service';
import { TenantFormMasterService } from './forms/tenant-form-master.service';
import { PopupSyncTenantModule } from './popup-sync-tenant/popup-sync-tenant.module';
import { RentManagerTenantComponent } from './rent-manager-tenant.component';
import { PopupVisibleStateService } from './state/popup-visible-state.service';
import { TenantOptionsStateService } from './state/tenant-options-state.service';
import { TenantStateService } from './state/tenant-state.service';
import { WidgetTenantModule } from './widget-tenant/widget-tenant.module';

@NgModule({
  declarations: [RentManagerTenantComponent],
  imports: [CommonModule, PopupSyncTenantModule, WidgetTenantModule],
  providers: [
    PopupVisibleStateService,
    TenantApiService,
    TenantFormMasterService,
    TenantOptionsStateService,
    TenantStateService
  ],
  exports: [RentManagerTenantComponent, WidgetTenantModule]
})
export class RentManagerTenantModule {}
