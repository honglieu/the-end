import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepBaseComponent } from './step-base/step-base.component';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { SharedModule } from '@/app/task-detail/modules/steps/shared/shared.module';
import { SharedModule as SharedAppModule } from '@shared/shared.module';
import { TrudiUiModule } from '@trudi-ui';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { TrudiDatePickerModule } from '@shared/components/date-picker2/date-picker.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { LeasingModule } from '@/app/leasing/leasing.module';
import { CalendarEventComponent } from './calendar-event.component';
import { BreachNoticeRemedyDateComponent } from './breach-notice-remedy-date/breach-notice-remedy-date.component';
import { EntryNoticeEntryDateComponent } from './entry-notice-entry-date/entry-notice-entry-date.component';
import { SchedulePropertyEntryModule } from './entry-notice-entry-date/components/schedule-property-entry/schedule-property-entry.module';
import { BreachContractFormModule } from './breach-notice-remedy-date/components/breach-contract-form/breach-contract-form.module';
import { CustomEventComponent } from './custom-event/custom-event.component';
import { ScheduleCustomEventComponentModule } from './custom-event/components/schedule-custom-event/schedule-custom-event.module';
import { PreventButtonModule } from '@trudi-ui';

@NgModule({
  declarations: [
    StepBaseComponent,
    CalendarEventComponent,
    BreachNoticeRemedyDateComponent,
    EntryNoticeEntryDateComponent,
    CustomEventComponent
  ],
  exports: [CalendarEventComponent],
  imports: [
    CommonModule,
    TrudiSendMsgModule,
    SharedModule,
    SharedAppModule,
    DragDropModule,
    CustomPipesModule,
    TrudiUiModule,
    TrudiDatePickerModule,
    ScrollingModule,
    SharePopUpModule,
    LeasingModule,
    SchedulePropertyEntryModule,
    BreachContractFormModule,
    ScheduleCustomEventComponentModule,
    PreventButtonModule
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CalendarEventModule {}
