import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NgModule,
  NO_ERRORS_SCHEMA
} from '@angular/core';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { SharedModule as SharedAppModule } from '@shared/shared.module';
import { ForwardViaEmailModule } from '@/app/task-detail/components/forward-via-email/forward-via-email.module';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { RentManagerInspectionModule } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-inspection/rent-manager-inspection.module';
import { RentManagerNotesModule } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/rent-manager-notes.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TrudiUiModule } from '@trudi-ui';
import { SharedModule } from '@/app/task-detail/modules/sidebar-left/shared/shared.module';
import { WidgetCommonModule } from '@/app/task-detail/modules/sidebar-right/components/widget-common/widget-common.module';
import { BillDetailPopupFormService } from './modules/rent-manager-issue/components/bill-detail-popup/services/bill-detail-popup-form.service';
import { BillDetailPopupService } from './modules/rent-manager-issue/components/bill-detail-popup/services/bill-detail-popup.service';
import { RentManagerIssueModule } from './modules/rent-manager-issue/rent-manager-issue.module';
import { PopupManagementService } from './modules/rent-manager-issue/services/popup-management.service';
import { RentManagerIssueBillDetailsService } from './modules/rent-manager-issue/services/rent-manager-issue-bill-details.service';
import { RentManagerIssueFormService } from './modules/rent-manager-issue/services/rent-manager-issue-form.service';
import { RentManagerIssueService } from './modules/rent-manager-issue/services/rent-manager-issue.service';
import { RentManagerLeaseRenewalModule } from './modules/rent-manager-lease-renewal/rent-manager-lease-renewal.module';
import { LeaseRenewalFormRMService } from './modules/rent-manager-lease-renewal/services/lease-renewal-form.service';
import { LeaseRenewalRMService } from './modules/rent-manager-lease-renewal/services/lease-renewal.service';
import { RentManagerTenantModule } from './modules/rent-manager-tenant/rent-manager-tenant.module';
import { RentManagerVacateDetailModule } from './modules/rent-manager-vacate-detail/rent-manager-vacate-detail.module';
import { WidgetRMService } from './services/widget-rent-manager.service';
import { WidgetRentManagerComponent } from './widget-rent-manager.component';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [WidgetRentManagerComponent],
  exports: [WidgetRentManagerComponent],
  providers: [
    PopupManagementService,
    RentManagerIssueFormService,
    RentManagerIssueService,
    LeaseRenewalFormRMService,
    LeaseRenewalRMService,
    WidgetRMService,
    BillDetailPopupService,
    BillDetailPopupFormService,
    RentManagerIssueBillDetailsService
  ],
  imports: [
    CommonModule,
    DragDropModule,
    TrudiSendMsgModule,
    NzToolTipModule,
    MoveMessToDifferentTaskModule,
    NzSkeletonModule,
    ForwardViaEmailModule,
    NzDropDownModule,
    SharedModule,
    SharedAppModule,
    SharePopUpModule,
    TrudiUiModule,
    TrudiDatePickerModule,
    SharedAppModule,
    TrudiDatePickerModule,
    RentManagerIssueModule,
    WidgetCommonModule,
    RentManagerLeaseRenewalModule,
    RentManagerNotesModule,
    RentManagerInspectionModule,
    RentManagerVacateDetailModule,
    RentManagerTenantModule,
    RxPush
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class WidgetRentManagerModule {}
