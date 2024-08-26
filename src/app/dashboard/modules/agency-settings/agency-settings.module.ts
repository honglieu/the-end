import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardSharedModule } from '@/app/dashboard/shared/dashboard-shared.module';
import { TrudiUiModule } from '@trudi-ui';
import { SharedModule } from '@shared/shared.module';
import { AgencySettingsComponent } from './agency-settings.component';
import { AgencySettingsRoutingModule } from './agency-settings-routing.module';
import { CompanyDetailsComponent } from './components/company-details/company-details.component';
import { CompanyEmailSignatureComponent } from './components/company-details/company-email-signature/company-email-signature.component';
import { SetWorkingHourComponent } from './components/company-details/set-working-hour/set-working-hour.component';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { EditorModule } from '@tinymce/tinymce-angular';
import { TeamComponent } from './components/team/team.component';
import { TeamActiveComponent } from './components/team/team-active/team-active.component';
import { TeamDeactiveComponent } from './components/team/team-deactive/team-deactive.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { AgencyLogoPopupComponent } from './components/company-details/agency-logo-popup/agency-logo-popup.component';
import { UploadLogoQuitConfirmComponent } from './components/company-details/upload-logo-quit-confirm/upload-logo-quit-confirm.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { SendInvitePopupComponent } from './components/team/send-invite-popup/send-invite-popup.component';
import { TeamAssignAdminComponent } from './components/team/team-assign-admin/team-assign-admin.component';
import { HeaderModule } from '@/app/header/header.module';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TeamAssignOwnerComponent } from './components/team/team-assign-owner/team-assign-owner.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TeamDeleteProfileComponent } from './components/team/team-delete-profile/team-delete-profile.component';
import { BillingComponent } from './components/billing/billing.component';
import { AgencyIntegrationsComponent } from './components/agency-integrations/agency-integrations.component';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { InvoiceHistoryComponent } from './components/billing/components/invoice-history/invoice-history.component';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { BillingTableComponent } from './components/billing/components/billing-table/billing-table.component';
import { InvoiceHistoryPopUpComponent } from './components/billing/components/invoice-history-pop-up/invoice-history-pop-up.component';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { VoicemailComponent } from './components/voicemail/voicemail.component';
import { CustomHoursPopupComponent } from './components/voicemail/custom-hours-popup/custom-hours-popup.component';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { AutomatedRepliesPolicyComponent } from './components/automated-replies-policy/automated-replies-policy.component';
import { AiRepliesTableComponent } from './components/automated-replies-policy/components/ai-replies-table/ai-replies-table.component';
import { AutosizeModule } from 'ngx-autosize';
import { ResponseTimeComponent } from './components/response-time/response-time.component';
import { EmergencyContactsComponent } from './components/mobile-app/emergency-contacts/emergency-contacts.component';
import { CheckboxPolicesItemComponent } from './components/shared/checkbox-polices-item/checkbox-polices-item.component';
import { SectionsContainerComponent } from './components/shared/section-container/sections-container.component';
import { SelectContactsComponent } from './components/shared/select-contacts/select-contacts.component';
import { RadioPolicesComponent } from './components/shared/radio-polices/radio-polices.component';
import { AddNewSupplierComponent } from './components/shared/add-new-supplier/add-new-supplier.component';
import { TrustAccountComponent } from './components/company-details/trust-account/trust-account.component';
import { NzTableModule } from 'ng-zorro-antd/table';
import { DefaultEmergencyContactsComponent } from './components/mobile-app/default-emergency-contacts/default-emergency-contacts.component';
import { CustomEmergencyContactsComponent } from './components/mobile-app/custom-emergency-contacts/custom-emergency-contacts.component';
import { FontSettingsComponent } from './components/font-settings/font-settings.component';
import { SelectTypeComponent } from './components/shared/select-type/select-type.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { EmergencyContactsService } from './components/mobile-app/services/emergency-contacts.service';
import { RxFor } from '@rx-angular/template/for';
import { SmsComponent } from './components/sms/sms.component';
import { MessengerComponent } from './components/messenger/messenger.component';
import { WhatsAppComponent } from './components/whatsapp/whatsapp.component';

@NgModule({
  declarations: [
    AgencySettingsComponent,
    CompanyDetailsComponent,
    CompanyEmailSignatureComponent,
    SetWorkingHourComponent,
    TeamComponent,
    TeamActiveComponent,
    TeamDeactiveComponent,
    AgencyLogoPopupComponent,
    UploadLogoQuitConfirmComponent,
    SendInvitePopupComponent,
    TeamAssignAdminComponent,
    TeamAssignOwnerComponent,
    TeamDeleteProfileComponent,
    BillingComponent,
    AgencyIntegrationsComponent,
    InvoiceHistoryComponent,
    BillingTableComponent,
    InvoiceHistoryPopUpComponent,
    VoicemailComponent,
    CustomHoursPopupComponent,
    AutomatedRepliesPolicyComponent,
    AiRepliesTableComponent,
    ResponseTimeComponent,
    EmergencyContactsComponent,
    CheckboxPolicesItemComponent,
    SectionsContainerComponent,
    SelectContactsComponent,
    RadioPolicesComponent,
    AddNewSupplierComponent,
    TrustAccountComponent,
    DefaultEmergencyContactsComponent,
    CustomEmergencyContactsComponent,
    FontSettingsComponent,
    SelectTypeComponent,
    SmsComponent,
    MessengerComponent,
    WhatsAppComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AgencySettingsRoutingModule,
    TrudiDatePickerModule,
    SharePopUpModule,
    EditorModule,
    FormsModule,
    DashboardSharedModule,
    TrudiUiModule,
    ImageCropperModule,
    HeaderModule,
    NzSkeletonModule,
    TrudiSendMsgModule,
    DragDropModule,
    ScrollingModule,
    NzToolTipModule,
    NzCollapseModule,
    CustomPipesModule,
    NgxMaskDirective,
    NgxMaskPipe,
    AutosizeModule,
    ReactiveFormsModule,
    NzTableModule,
    NzDropDownModule,
    NzMenuModule,
    RxFor
  ],
  providers: [provideNgxMask(), EmergencyContactsService],
  exports: []
})
export class AgencySettingsModule {}
