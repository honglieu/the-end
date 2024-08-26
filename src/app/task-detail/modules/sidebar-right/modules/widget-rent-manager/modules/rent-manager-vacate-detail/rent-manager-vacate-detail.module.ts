import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule as SidebarLeftSharedModule } from '@/app/task-detail/modules/sidebar-left/shared/shared.module';
import { SharedModule } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/shared/shared.module';
import { WidgetCommonModule } from '@/app/task-detail/modules/sidebar-right/components/widget-common/widget-common.module';
import { RentManagerVacateDetailComponent } from './rent-manager-vacate-detail.component';
import { RentManagerVacateDetailService } from './rent-manager-vacate-detail.service';
import { VacateDetailFormModule } from './vacate-detail-form/vacate-detail-form.module';
import { FormVacateDetailService } from './vacate-detail-form/vacate-detail-form.service';
import { VacateDetailRmWidgetComponent } from './vacate-detail-rm-widget/vacate-detail-rm-widget.component';

@NgModule({
  declarations: [
    RentManagerVacateDetailComponent,
    VacateDetailRmWidgetComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    SidebarLeftSharedModule,
    WidgetCommonModule,
    VacateDetailFormModule
  ],
  exports: [RentManagerVacateDetailComponent, VacateDetailRmWidgetComponent],
  providers: [RentManagerVacateDetailService, FormVacateDetailService]
})
export class RentManagerVacateDetailModule {}
