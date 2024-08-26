import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { MsgAttachmentLoadModule } from '@shared/components/msg-attachment-load/msg-attachment-load.module';
import { LandlordToOwnerPipe } from '@shared/pipes/landlord-to-owner.pipe';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';
import { SharedModule } from '@shared/shared.module';
import { TenantVacateService } from '@/app/tenant-vacate/services/tenant-vacate.service';
import { TrudiContactCardComponent } from './components/trudi-contact-card/trudi-contact-card.component';
import { TrudiReiFormComponent } from './components/trudi-rei-form-card/trudi-rei-form-card.component';
import { TrudiSelectReceiverContainerComponent } from './components/trudi-select-receiver-container/trudi-select-receiver-container.component';
import { TrudiSelectReceiverPreviewComponent } from './components/trudi-select-receiver-preview/trudi-select-receiver-preview.component';
import { TrudiSelectReceiverV2Component } from './components/trudi-select-receiver-v2/trudi-select-receiver-v2.component';
import { TrudiSelectReceiverComponent } from './components/trudi-select-receiver/trudi-select-receiver.component';
import { TrudiSendMsgBodyV2Component } from './components/trudi-send-msg-body-v2/trudi-send-msg-body-v2.component';
import { TrudiSendMsgBodyComponent } from './components/trudi-send-msg-body/trudi-send-msg-body.component';
import { TrudiSendMsgFileComponent } from './components/trudi-send-msg-file/trudi-send-msg-file.component';
import { TrudiSendMsgPropertyComponent } from './components/trudi-send-msg-header/components/trudi-send-msg-property/trudi-send-msg-property.component';
import { TrudiSendOptionMenuComponent } from './components/trudi-send-msg-header/components/trudi-send-option-menu/trudi-send-option-menu.component';
import { TrudiSendMsgHeaderComponent } from './components/trudi-send-msg-header/trudi-send-msg-header.component';
import { SelectRecipientsModalComponent } from './components/select-recipients-modal/select-recipients-modal.component';
import { ViewRecipientsModalComponent } from './components/view-recipients-modal/view-recipients-modal.component';
import { MissingDataModalComponent } from './components/missing-data-modal/missing-data-modal.component';
import { TrudiSendMsgFormService } from './services/trudi-send-msg-form.service';
import { TrudiSendMsgService } from './services/trudi-send-msg.service';
import { TrudiSendMsgV2Component } from './trudi-send-msg-v2.component';
import { TrudiSendMsgComponent } from './trudi-send-msg.component';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { TrudiSendMsgV3Component } from '@/app/trudi-send-msg/trudi-send-msg-v3.component';
import { TrudiBulkSendMsgComponent } from './trudi-bulk-send-msg.component';
import { TrudiBulkSendMsgHeaderComponent } from './components/trudi-bulk-send-msg-container/trudi-bulk-send-msg-header/trudi-bulk-send-msg-header.component';
import { TrudiBulkSendMsgRightComponent } from './components/trudi-bulk-send-msg-container/trudi-bulk-send-msg-right/trudi-bulk-send-msg-right.component';
import { TrudiBulkSendMsgLeftComponent } from './components/trudi-bulk-send-msg-container/trudi-bulk-send-msg-left/trudi-bulk-send-msg-left.component';
import { BulkSendToComponent } from './components/trudi-bulk-send-msg-container/trudi-bulk-send-msg-left/bulk-send-to/bulk-send-to.component';
import { ConfirmRecipientComponent } from './components/trudi-bulk-send-msg-container/trudi-bulk-send-msg-left/confirm-recipient/confirm-recipient.component';
import { TriggerStepComponent } from './components/trudi-bulk-send-msg-container/trudi-bulk-send-msg-left/trigger-step/trigger-step.component';
import { ContactTitlePipe } from './pipes/contact-title-transform.pipe';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { ContactIndexPipe } from './components/trudi-bulk-send-msg-container/trudi-bulk-send-msg-left/confirm-recipient/pipes/contact-index.pipe';
import {
  RemoveFileExtensionPipe,
  TrudiSendMsgFileV2Component
} from './components/trudi-send-msg-file-v2/trudi-send-msg-file-v2.component';
import { RouterModule } from '@angular/router';
import { ConfirmRecipientsModalComponent } from './components/confirm-recipient-modal/confirm-recipient-modal.component';
import { SelectStepComponent } from './components/confirm-recipient-modal/select-step/select-step.component';
import { SelectReceiverModule } from '@shared/components/select-receiver/select-receiver.module';
import { AIDetectPolicyService } from '@/app/dashboard/components/ai-interactive-bubble/services/ai-detect-policy.service';
import { SendEmailToLabelPipe } from './pipes/send-email-to-label.pipe';
import { SuggestDatePipe } from '@/app/shared/components/chat/ticket-modal/pipes/suggest-date.pipe';
import { TrudiUiModule } from '@trudi-ui';
import { AiInteractiveBuilderService } from '@/app/shared';

@NgModule({
  declarations: [
    TrudiSendMsgComponent,
    TrudiSelectReceiverComponent,
    TrudiSendMsgBodyComponent,
    TrudiSendMsgFileComponent,
    TrudiSendMsgFileV2Component,
    TrudiContactCardComponent,
    TrudiReiFormComponent,
    TrudiSendOptionMenuComponent,
    TrudiSendMsgV2Component,
    TrudiSendMsgBodyV2Component,
    TrudiSelectReceiverV2Component,
    TrudiSelectReceiverContainerComponent,
    TrudiSelectReceiverPreviewComponent,
    TrudiSendMsgPropertyComponent,
    TrudiSendMsgHeaderComponent,
    SelectRecipientsModalComponent,
    ConfirmRecipientsModalComponent,
    SelectStepComponent,
    ViewRecipientsModalComponent,
    MissingDataModalComponent,
    TrudiSendMsgV3Component,
    TrudiBulkSendMsgComponent,
    TrudiBulkSendMsgHeaderComponent,
    TrudiBulkSendMsgRightComponent,
    TrudiBulkSendMsgLeftComponent,
    BulkSendToComponent,
    ConfirmRecipientComponent,
    TriggerStepComponent,
    ContactTitlePipe,
    SendEmailToLabelPipe,
    ContactIndexPipe,
    RemoveFileExtensionPipe
  ],
  imports: [
    CommonModule,
    SharePopUpModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    NgOptionHighlightModule,
    NzToolTipModule,
    ScrollingModule,
    RouterModule,
    MsgAttachmentLoadModule,
    NzSkeletonModule,
    SelectReceiverModule,
    TrudiUiModule
  ],
  exports: [
    TrudiSendMsgComponent,
    TrudiSelectReceiverComponent,
    TrudiContactCardComponent,
    TrudiReiFormComponent,
    TrudiSendMsgV2Component,
    TrudiSendMsgV3Component,
    SelectRecipientsModalComponent,
    ConfirmRecipientsModalComponent,
    TrudiBulkSendMsgComponent,
    TrudiSendMsgFileComponent,
    TrudiSendMsgFileV2Component
  ],
  providers: [
    TrudiSendMsgFormService,
    TrudiSendMsgService,
    AIDetectPolicyService,
    TenantVacateService,
    TrudiTitleCasePipe,
    SuggestDatePipe,
    LandlordToOwnerPipe,
    ContactTitleByConversationPropertyPipe,
    AiInteractiveBuilderService
  ]
})
export class TrudiSendMsgModule {}
