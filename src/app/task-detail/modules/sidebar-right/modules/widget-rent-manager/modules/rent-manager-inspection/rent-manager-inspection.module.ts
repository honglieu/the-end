import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RentManagerInspectionComponent } from './rent-manager-inspection.component';
import { TrudiUiModule } from '@trudi-ui';
import { InspectionRmWidgetComponent } from './components/inspection-rm-widget/inspection-rm-widget.component';
import { RentManagerInspectionFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/services/rent-manager-inspection-form.service';
import { SharedModule as SharedWidgetRentManagerModule } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/shared/shared.module';
import { InspectionRmFormComponent } from './components/inspection-rm-form/inspection-rm-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { SharedModule } from '@shared/shared.module';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { RentManagerInspectionApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/services/rent-manager-inspection-api.service';
import { RentManagerInspectionCardComponent } from './components/rent-manager-inspection-card/rent-manager-inspection-card.component';
import { WidgetCommonModule } from '@/app/task-detail/modules/sidebar-right/components/widget-common/widget-common.module';
import { SharedModule as ShareTrudiSuggestedStepModule } from '@/app/task-detail/modules/sidebar-left/shared/shared.module';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { AreaHeaderComponent } from './components/area-header/area-header.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
@NgModule({
  declarations: [
    RentManagerInspectionComponent,
    InspectionRmWidgetComponent,
    InspectionRmFormComponent,
    RentManagerInspectionCardComponent,
    AreaHeaderComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TrudiUiModule,
    SharedWidgetRentManagerModule,
    CustomPipesModule,
    SharedModule,
    ShareTrudiSuggestedStepModule,
    TrudiDatePickerModule,
    WidgetCommonModule,
    NzDropDownModule,
    ScrollingModule
  ],
  providers: [
    RentManagerInspectionFormService,
    RentManagerInspectionApiService
  ],
  exports: [RentManagerInspectionComponent, InspectionRmWidgetComponent]
})
export class RentManagerInspectionModule {}
