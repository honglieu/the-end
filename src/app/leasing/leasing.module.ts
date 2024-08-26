import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
import { AutosizeModule } from 'ngx-autosize';
import { SharedModule } from '@shared/shared.module';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { TrudiOutletModule } from '@core/outlet';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { TenancyDetailComponent } from './components/sync-property-tree-leasing/components/tenancy-detail/tenancy-detail.component';
import { LeaseDetailsComponent } from './components/sync-property-tree-leasing/components/lease-details/lease-details.component';
import { RentScheduleComponent } from './components/sync-property-tree-leasing/components/rent-schedule/rent-schedule.component';
import { EntryInspectionComponent } from './components/sync-property-tree-leasing/components/entry-inspection/entry-inspection.component';
import { BondComponent } from './components/sync-property-tree-leasing/components/bond/bond.component';
import { TenancyContactCardComponent } from './components/sync-property-tree-leasing/components/tenancy-contact-card/tenancy-contact-card.component';
import { SyncPropertyTreeLeasingService } from './services/sync-property-tree-leasing.service';
import { SyncPropertyTreeLeasingFormService } from './services/sync-property-tree-leasing-form.service';
import { SyncPropertyTreeLeasingApiService } from './services/sync-property-tree-leasing-api.service';
import { AddTenantContactPopUpComponent } from './components/sync-property-tree-leasing/components/add-tenant-contact-pop-up/add-tenant-contact-pop-up.component';
import { ReturnFormDueDateComponent } from './components/return-form-due-date/return-form-due-date.component';
import { ConfirmTenantContactPopUpComponent } from './components/sync-property-tree-leasing/components/confirm-tenant-contact-pop-up/confirm-tenant-contact-pop-up.component';
import { OneFieldPopupComponent } from '@shared/components/one-field-popup/one-field-popup.component';
import { LeasingLandlordApplicationsShortlistPopupComponent } from './components/leasing-landlord-applications-shortlist-popup/leasing-landlord-applications-shortlist-popup.component';
import { LeasingFormService } from './services/leasing-form.service';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';
import { SharedModule as SharedSideBarLeftModule } from '@/app/task-detail/modules/sidebar-left/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { PreventButtonModule, TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [
    TenancyDetailComponent,
    LeaseDetailsComponent,
    RentScheduleComponent,
    BondComponent,
    EntryInspectionComponent,
    TenancyContactCardComponent,
    AddTenantContactPopUpComponent,
    ReturnFormDueDateComponent,
    ConfirmTenantContactPopUpComponent,
    OneFieldPopupComponent,
    LeasingLandlordApplicationsShortlistPopupComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AutosizeModule,
    TrudiSendMsgModule,
    SharePopUpModule,
    TrudiSendMsgModule,
    TrudiOutletModule,
    ReactiveFormsModule,
    TrudiDatePickerModule,
    PdfJsViewerModule,
    NgxDocViewerModule,
    SharedSideBarLeftModule,
    NgxMaskDirective,
    NgxMaskPipe,
    PreventButtonModule,
    TrudiUiModule
  ],
  exports: [
    LeaseDetailsComponent,
    TenancyDetailComponent,
    RentScheduleComponent,
    BondComponent,
    AddTenantContactPopUpComponent,
    ConfirmTenantContactPopUpComponent,
    LeasingLandlordApplicationsShortlistPopupComponent,
    OneFieldPopupComponent,
    ReturnFormDueDateComponent
  ],
  providers: [
    SyncPropertyTreeLeasingService,
    SyncPropertyTreeLeasingFormService,
    SyncPropertyTreeLeasingApiService,
    LeasingFormService,
    TrudiTitleCasePipe,
    provideNgxMask()
  ]
})
export class LeasingModule {}
