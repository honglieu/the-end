import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormatDueDayPipe,
  WidgetTenantComponent
} from './widget-tenant.component';
import { WidgetCommonModule } from '@/app/task-detail/modules/sidebar-right/components/widget-common/widget-common.module';
import { SharedModule } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/shared/shared.module';
import { SharedModule as SidebarLeftSharedModule } from '@/app/task-detail/modules/sidebar-left/shared/shared.module';

@NgModule({
  declarations: [WidgetTenantComponent, FormatDueDayPipe],
  imports: [
    CommonModule,
    SharedModule,
    SidebarLeftSharedModule,
    WidgetCommonModule
  ],
  exports: [WidgetTenantComponent]
})
export class WidgetTenantModule {}
