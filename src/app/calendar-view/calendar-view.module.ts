import { ProfileSettingService } from '@services/profile-setting.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { CalendarViewComponent } from './calendar-view.component';
import { CalendarViewRoutingModule } from './calendar-view-routing.module';
import { AddHolidayPopUpComponent } from './add-holiday-pop-up/add-holiday-pop-up.component';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { DuplicateHolidayPopupComponent } from './duplicate-holiday-popup/duplicate-holiday-popup.component';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [
    CalendarViewComponent,
    AddHolidayPopUpComponent,
    DuplicateHolidayPopupComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    CalendarViewRoutingModule,
    TrudiDatePickerModule,
    SharePopUpModule,
    NgxMaskDirective,
    NgxMaskPipe,
    TrudiUiModule
  ],
  providers: [ProfileSettingService, provideNgxMask()]
})
export class CalendarViewModule {}
