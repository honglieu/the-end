import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TrudiUiModule } from '@trudi-ui';
import { SharedModule as SharedWidgetRentManagerModule } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/shared/shared.module';
import { TenantFormModule } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form.module';
import { TenantTabGroupModule } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/tenant-tab-group/tenant-tab-group.module';
import {
  PopupSyncTenantComponent,
  TenantFormDirective
} from './popup-sync-tenant.component';
import { PopupSyncTenantService } from './popup-sync-tenant.service';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [PopupSyncTenantComponent, TenantFormDirective],
  imports: [
    CommonModule,
    TrudiUiModule,
    TenantFormModule,
    TenantTabGroupModule,
    SharedWidgetRentManagerModule,
    RxPush
  ],
  exports: [PopupSyncTenantComponent],
  providers: [PopupSyncTenantService]
})
export class PopupSyncTenantModule {}
