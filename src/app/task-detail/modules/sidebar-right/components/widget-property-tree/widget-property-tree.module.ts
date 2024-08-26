import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetPropertyTreeComponent } from './widget-property-tree.component';
import { WidgetPTService } from './services/widget-property.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { LeasingModule } from '@/app/leasing/leasing.module';
import { ForwardViaEmailModule } from '@/app/task-detail/components/forward-via-email/forward-via-email.module';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { TenantVacateModule } from '@/app/tenant-vacate/tenant-vacate.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { SharedModule } from '@/app/task-detail/modules/sidebar-left/shared/shared.module';
import { IngoingPopupComponent } from './components/ingoing-inspection/ingoing-popup/ingoing-popup.component';
import { IngoingInspectionFormService } from './services/ingoing-inspection-form.service';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { TrudiUiModule } from '@trudi-ui';
import { RoutinePopupComponent } from './components/routine-inspection/routine-popup/routine-popup.component';
import { SelectRoutineInspectionComponent } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/routine-inspection/routine-popup/select-routine-inspection/select-routine-inspection.component';
import { SyncRoutineInspectionComponent } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/routine-inspection/routine-popup/sync-routine-inspection/sync-routine-inspection.component';
import { RoutineInspectionFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/routine-inspection-form.service';
import { RoutineWidgetComponent } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/routine-inspection/routine-widget/routine-widget.component';
import { LeaseRenewalPTPopupComponent } from './components/lease-renewal/lease-renewal-widget.component';
import { LeaseRenewalFormComponent } from './components/lease-renewal/components/lease-renewal-form/lease-renewal-form.component';
import { CardLeaseRenewalComponent } from './components/lease-renewal/components/card-widget-lease-renewal/card-widget-lease-renewal.component';
import { SharedModule as SharedAppModule } from '@shared/shared.module';
import { TenantVacateWidgetComponent } from './components/tenant-vacate-widget/tenant-vacate-widget.component';
import { TenantVacateFormComponent } from './components/tenant-vacate-widget/components/tenant-vacate-form/tenant-vacate-form.component';
import { VacateDetailsPopupComponent } from './components/tenant-vacate-widget/components/vacate-details-popup/vacate-details-popup.component';
import { CardWidgetTenantVacateComponent } from './components/tenant-vacate-widget/components/card-widget-tenant-vacate/card-widget-tenant-vacate.component';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { ComplianceComponent } from './components/compliance/compliance.component';
import { SyncCompliancePopupComponent } from './components/compliance/components/sync-compliance-popup/sync-compliance-popup.component';
import { ComplianceFormComponent } from './components/compliance/components/compliance-form/compliance-form.component';
import { SyncStatusComponent } from './components/sync-status/sync-status.component';
import { CreateSelectUpdateCompliancePopupComponent } from './components/compliance/components/create-select-update-compliance-popup/create-select-update-compliance-popup.component';
import { WidgetComplianceComponent } from './components/compliance/components/widget-compliance/widget-compliance.component';
import { CreditorInvoiceSyncComponent } from './components/creditor-invoice/creditor-invoice-widget/creditor-invoice-sync.component';
import { SelectInspectionComponent } from './components/ingoing-inspection/ingoing-popup/select-inspection/select-inspection.component';
import { SyncInspectionComponent } from './components/ingoing-inspection/ingoing-popup/sync-inspection/sync-inspection.component';
import { IngoingWidgetComponent } from './components/ingoing-inspection/ingoing-widget/ingoing-widget.component';
import { LeasingWidgetService } from './services/leasing.service';
import { LeasingPopupComponent } from './components/leasing/leasing-popup/leasing-popup.component';
import { LeasingWidgetComponent } from './components/leasing/leasing-widget/leasing-widget.component';
import { RoutineInspectionSyncService } from './services/routine-inspection.service';
import { TenancyInvoiceService } from './services/tenancy-invoice.service';
import { TenancyInvoicePopupComponent } from './components/tenancy-invoice/tenancy-invoice-popup/tenancy-invoice-popup.component';
import { TenancyInvoiceWidgetComponent } from './components/tenancy-invoice/tenancy-invoice-widget/tenancy-invoice-widget.component';
import { SyncNotePopupComponent } from './components/note/sync-note-popup/sync-note-pop-up.component';
import { SelectNotePopUpComponent } from './components/note/select-note-pop-up/select-note-pop-up.component';
import { WidgetNoteComponent } from './components/note/widget-note/widget-note.component';
import { SelectUpdateNotePopUpComponent } from './components/note/update-note-widget/select-update-note-pop-up/select-update-note-pop-up.component';
import { IngoingInspectionSyncService } from './services/ingoing-inspection.service';
import { CreditorInvoiceComponent } from './components/creditor-invoice/creditor-invoice-popup/creditor-invoice.component';
import { OutgoingPopupComponent } from './components/outgoing-inspection/outgoing-popup/outgoing-popup.component';
import { OutgoingWidgetComponent } from './components/outgoing-inspection/outgoing-widget/outgoing-widget.component';
import { SelectOutgoingInspectionComponent } from './components/outgoing-inspection/outgoing-popup/select-outgoing-inspection/select-outgoing-inspection.component';
import { SyncOutgoingInspectionComponent } from './components/outgoing-inspection/outgoing-popup/sync-outgoing-inspection/sync-outgoing-inspection.component';
import { OutgoingInspectionFormService } from './services/outgoing-inspection-form.service';
import { OutgoingInspectionSyncService } from './services/outgoing-inspection.service';
import { MaintenanceRequestPtPopupComponent } from './components/maintenance/maintenance-request-pt-popup/maintenance-request-pt-popup.component';
import { MaintenanceRequestCardComponent } from './components/maintenance/component/maintenance-request-card/maintenance-request-card.component';
import { MaintenanceInvoiceCardComponent } from './components/maintenance/component/maintenance-invoice-card/maintenance-invoice-card.component';
import { MaintenanceInvoicePtPopupComponent } from './components/maintenance/maintenance-invoice-pt-popup/maintenance-invoice-pt-popup.component';
import { PreviewInvoiceFileComponent } from './components/maintenance/component/preview-invoice-file/preview-invoice-file.component';
import { MaintenanceWidgetComponent } from './components/maintenance/component/maintenance-widget/maintenance-widget.component';
import { MaintenanceInvoiceFormService } from './services/maintenance-invoice-form.service';
import { WidgetNoteService } from './services/widget-note.service';
import { CreditorInvoicingPropertyService } from './services/creditor-invoice.service';
import { ListWidgetLeaseRenewalComponent } from './components/lease-renewal/components/list-widget-lease-renewal/list-widget-lease-renewal.component';
import { MaintenanceSyncPtService } from './services/maintenance-sync-pt.service';
import { InvoiceWidgetComponent } from './components/invoice-widget/invoice-widget.component';
import { VacateDetailService } from './services/vacate-detail.service';
import { PropertyTreeWidgetNotesComponent } from './components/note/property-tree-widget-notes/property-tree-widget-notes.component';
import { WidgetCommonModule } from '@/app/task-detail/modules/sidebar-right/components/widget-common/widget-common.module';
import { ComplianceService } from '@/app/compliance/services/compliance.service';
import { LeaseRenewalAttachFileButtonComponent } from './components/lease-renewal/components/lease-renewal-form/lease-renewal-attach-file-button/lease-renewal-attach-file-button.component';
import { LeaseRenewalAttachFilePopupComponent } from './components/lease-renewal/components/lease-renewal-form/lease-renewal-attach-file-button/lease-renewal-attach-file-popup/lease-renewal-attach-file-popup.component';
import { SelectExistingInvoiceComponent } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/select-existing-invoice/select-existing-invoice.component';
import { PreventButtonModule } from '@trudi-ui';
import { PopupWidgetPropertyTreeComponent } from './components/popup-widget-property-tree/popup-widget-property-tree.component';
import { InspectionPopupTitleComponent } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/common/inspection-popup-title/inspection-popup-title.component';
import { WidgetPropertyTreeApiService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property-tree-api.service';
import { RxPush } from '@rx-angular/template/push';
import { PreferredContactMethodComponent } from '@/app/leasing/components/sync-property-tree-leasing/components/preferred-contact-method/preferred-contact-method.component';

@NgModule({
  declarations: [
    WidgetPropertyTreeComponent,
    CreditorInvoiceComponent,
    CreditorInvoiceSyncComponent,
    LeasingPopupComponent,
    LeasingWidgetComponent,
    SyncStatusComponent,
    IngoingPopupComponent,
    SelectInspectionComponent,
    SyncInspectionComponent,
    IngoingWidgetComponent,
    TenancyInvoicePopupComponent,
    TenancyInvoiceWidgetComponent,
    RoutinePopupComponent,
    SelectRoutineInspectionComponent,
    SyncRoutineInspectionComponent,
    RoutineWidgetComponent,
    SyncNotePopupComponent,
    SelectNotePopUpComponent,
    WidgetNoteComponent,
    SelectUpdateNotePopUpComponent,
    LeaseRenewalPTPopupComponent,
    LeaseRenewalFormComponent,
    ListWidgetLeaseRenewalComponent,
    CardLeaseRenewalComponent,
    TenantVacateFormComponent,
    VacateDetailsPopupComponent,
    CardWidgetTenantVacateComponent,
    TenantVacateWidgetComponent,
    SyncStatusComponent,
    ComplianceComponent,
    SyncCompliancePopupComponent,
    ComplianceFormComponent,
    CreateSelectUpdateCompliancePopupComponent,
    WidgetComplianceComponent,
    OutgoingPopupComponent,
    OutgoingWidgetComponent,
    SelectOutgoingInspectionComponent,
    SyncOutgoingInspectionComponent,
    WidgetComplianceComponent,
    MaintenanceRequestPtPopupComponent,
    MaintenanceRequestCardComponent,
    MaintenanceInvoiceCardComponent,
    MaintenanceInvoicePtPopupComponent,
    PreviewInvoiceFileComponent,
    MaintenanceWidgetComponent,
    InvoiceWidgetComponent,
    PropertyTreeWidgetNotesComponent,
    LeaseRenewalAttachFileButtonComponent,
    LeaseRenewalAttachFilePopupComponent,
    SelectExistingInvoiceComponent,
    PopupWidgetPropertyTreeComponent,
    InspectionPopupTitleComponent
  ],
  exports: [WidgetPropertyTreeComponent, PopupWidgetPropertyTreeComponent],
  providers: [
    WidgetPTService,
    IngoingInspectionFormService,
    IngoingInspectionSyncService,
    OutgoingInspectionFormService,
    OutgoingInspectionSyncService,
    TenancyInvoiceService,
    RoutineInspectionFormService,
    RoutineInspectionSyncService,
    LeasingWidgetService,
    MaintenanceInvoiceFormService,
    WidgetNoteService,
    CreditorInvoicingPropertyService,
    MaintenanceSyncPtService,
    VacateDetailService,
    ComplianceService,
    WidgetPropertyTreeApiService
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
    LeasingModule,
    TenantVacateModule,
    SharedModule,
    SharedAppModule,
    SharePopUpModule,
    TrudiUiModule,
    TrudiDatePickerModule,
    SharedAppModule,
    TrudiDatePickerModule,
    WidgetCommonModule,
    PreventButtonModule,
    RxPush,
    PreferredContactMethodComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class WidgetPropertyTreeModule {}
