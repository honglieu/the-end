import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { AutosizeModule } from 'ngx-autosize';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { TrudiOutletModule } from '@core';
import { ReactiveFormsModule } from '@angular/forms';
import { TrudiUiModule } from '@trudi-ui';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { LeaveNoticeDetailPopupComponent } from './components/leave-notice-detail-popup/leave-notice-detail-popup.component';
import { SharedModule as SharedSidebarLeftModule } from '@/app/task-detail/modules/sidebar-left/shared/shared.module';
import { TenantVacateService } from './services/tenant-vacate.service';

@NgModule({
  declarations: [LeaveNoticeDetailPopupComponent],
  imports: [
    CommonModule,
    SharedModule,
    AutosizeModule,
    SharePopUpModule,
    TrudiOutletModule,
    ReactiveFormsModule,
    TrudiUiModule,
    TrudiDatePickerModule,
    SharedSidebarLeftModule
  ],
  exports: [LeaveNoticeDetailPopupComponent],
  providers: [TenantVacateService]
})
export class TenantVacateModule {}
