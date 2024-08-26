import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrudiUiModule } from '@trudi-ui';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NgSelectModule } from '@ng-select/ng-select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { SharedModule as SharedWidgetRentManagerModule } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/shared/shared.module';
import { SharedModule } from '@shared/shared.module';
import { TrudiSendMsgUserService } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { SharedModule as SharedModuleSidebarLeft } from '@/app/task-detail/modules/sidebar-left/shared/shared.module';
import { RentManagerLeaseRenewalComponent } from './rent-manager-lease-renewal';
import { RecurringChargeDetailsComponent } from './components/lease-renewal/lease-renewal-popup/components/recurring-charge-details/recurring-charge-details.component';
import { LeaseRenewalRMPopupComponent } from './components/lease-renewal/lease-renewal-popup/lease-renewal-popup.component';
import {
  FormatAmountPipe,
  LeaseRenewalFormRMComponent
} from './components/lease-renewal/lease-renewal-popup/components/lease-renewal-form/lease-renewal-form.component';
import { LeaseRenewalRMWidgetComponent } from './components/lease-renewal/lease-renewal-widget/lease-renewal-widget.component';
import { WidgetCommonModule } from '@/app/task-detail/modules/sidebar-right/components/widget-common/widget-common.module';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@NgModule({
  declarations: [
    RentManagerLeaseRenewalComponent,
    LeaseRenewalFormRMComponent,
    RecurringChargeDetailsComponent,
    LeaseRenewalRMPopupComponent,
    LeaseRenewalRMWidgetComponent,
    FormatAmountPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TrudiUiModule,
    NzTabsModule,
    NzTableModule,
    NgSelectModule,
    NzSkeletonModule,
    TrudiDatePickerModule,
    SharedModule,
    SharedWidgetRentManagerModule,
    SharedModuleSidebarLeft,
    WidgetCommonModule,
    NzToolTipModule
  ],
  providers: [TrudiSendMsgUserService],
  exports: [RentManagerLeaseRenewalComponent, LeaseRenewalRMWidgetComponent]
})
export class RentManagerLeaseRenewalModule {}
