import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { SharedModule } from '@shared/shared.module';
import { SharedModule as SidebarLeftSharedModule } from '@/app/task-detail/modules/sidebar-left/shared/shared.module';
import { PurchaseOrderService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/purchase-order-popup/services/purchase-order.service';
import { RentManagerInvoiceDetailsPopupComponent } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/rent-manager-invoice-details-popup/rent-manager-invoice-details-popup.component';
import { RentManagerIssueInvoiceDetailsFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/rent-manager-invoice-details-popup/services/rent-manager-issue-invoice-details-form.service';
import { RentManagerIssueInvoiceDetailsService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/rent-manager-invoice-details-popup/services/rent-manager-issue-invoice-details.service';
import { TrudiSendMsgUserService } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { TrudiUiModule } from '@trudi-ui';
import { BillTypeDisabledPipe } from '@/app/task-detail/modules/sidebar-right/pipes/bill-type-disabled';
import { ViewBillPipe } from '@/app/task-detail/modules/sidebar-right/pipes/view-bill';
import { ViewFailedSyncBillPipe } from '@/app/task-detail/modules/sidebar-right/pipes/view-failed-sync-bill';
import { RentManagerCardComponent } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/components/rent-manager-card/rent-manager-card.component';
import { SharedModule as SharedWidgetRentManagerModule } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/shared/shared.module';
import { BillDetailPopupComponent } from './components/bill-detail-popup/bill-detail-popup.component';
import { BillDetailSectionComponent } from './components/bill-detail-popup/components/bill-detail-section/bill-detail-section.component';
import { BillBillableToSelectComponent } from './components/bill-detail-popup/components/bill-detail-table/bill-billable-to-select/bill-billable-to-select.component';
import { BillDetailTableComponent } from './components/bill-detail-popup/components/bill-detail-table/bill-detail-table.component';
import { IssueRmWidgetComponent } from './components/issue-rm-widget/issue-rm-widget.component';
import { PurchaseOrderBillListComponent } from './components/purchase-order-popup/components/purchase-order-bill-list/purchase-order-bill-list.component';
import { PurchaseOrderDetailComponent } from './components/purchase-order-popup/components/purchase-order-detail/purchase-order-detail.component';
import { PurchaseOrderPopupComponent } from './components/purchase-order-popup/purchase-order-popup.component';
import { InvoiceDetailsInfoComponent } from './components/rent-manager-invoice-details-popup/components/invoice-details-info/invoice-details-info.component';
import { InvoiceDetailsTableComponent } from './components/rent-manager-invoice-details-popup/components/invoice-details-table/invoice-details-table.component';
import { GeneralInformationComponent } from './components/rent-manager-issue-popup/components/general-information/general-information.component';
import { IssueCheckListComponent } from './components/rent-manager-issue-popup/components/issue-check-list/issue-check-list.component';
import { IssueDetailsComponent } from './components/rent-manager-issue-popup/components/issue-details/issue-details.component';
import { IssueHistoryNotesComponent } from './components/rent-manager-issue-popup/components/issue-history-notes/issue-history-notes.component';
import { WorkOrderComponent } from './components/rent-manager-issue-popup/components/work-order/work-order.component';
import { RentManagerIssuePopupComponent } from './components/rent-manager-issue-popup/rent-manager-issue-popup.component';
import { TotalCostPipe } from './pipes/total-cost.pipe';
import { RentManagerIssueComponent } from './rent-manager-issue.component';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [
    RentManagerIssueComponent,
    RentManagerIssuePopupComponent,
    GeneralInformationComponent,
    IssueDetailsComponent,
    PurchaseOrderPopupComponent,
    PurchaseOrderDetailComponent,
    PurchaseOrderBillListComponent,
    TotalCostPipe,
    WorkOrderComponent,
    BillTypeDisabledPipe,
    IssueCheckListComponent,
    IssueHistoryNotesComponent,
    RentManagerInvoiceDetailsPopupComponent,
    ViewBillPipe,
    IssueRmWidgetComponent,
    RentManagerCardComponent,
    BillDetailPopupComponent,
    BillDetailTableComponent,
    BillDetailSectionComponent,
    BillBillableToSelectComponent,
    ViewFailedSyncBillPipe,
    InvoiceDetailsTableComponent,
    InvoiceDetailsInfoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule,
    TrudiUiModule,
    NzDropDownModule,
    NzTabsModule,
    NzTableModule,
    TrudiDatePickerModule,
    SharedModule,
    SharedWidgetRentManagerModule,
    NzDropDownModule,
    NzToolTipModule,
    NgOptionHighlightModule,
    CustomPipesModule,
    SidebarLeftSharedModule,
    RxPush
  ],
  providers: [
    TrudiSendMsgUserService,
    RentManagerIssueInvoiceDetailsFormService,
    RentManagerIssueInvoiceDetailsService,
    PurchaseOrderService
  ],
  exports: [RentManagerIssueComponent, IssueRmWidgetComponent]
})
export class RentManagerIssueModule {}
