import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { TrudiDatePickerModule } from '@shared/components/date-picker2/date-picker.module';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { SharedModule as SharedAppModule } from '@shared/shared.module';
import { TenantVacateModule } from '@/app/tenant-vacate/tenant-vacate.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TrudiUiModule } from '@trudi-ui';
import { LeasingModule } from '@/app/leasing/leasing.module';
import { SharedModule } from '@/app/task-detail/modules/steps/shared/shared.module';
import { ApplicationShortlistComponent } from './application-shortlist/application-shortlist.component';
import { BondAmountDueComponent } from './bond-amount-due/bond-amount-due.component';
import { BondReturnSummaryComponent } from './bond-return-summary/bond-return-summary.component';
import { CaptureAmountOwingToVacateComponent } from './capture-amount-owing-to-vacate/capture-amount-owing-to-vacate.component';
import { CaptureBreakLeaseFeeComponent } from './capture-break-lease-fee/capture-break-lease-fee.component';
import { CaptureBreakLeaseFeePopUpComponent } from './capture-break-lease-fee/components/capture-break-lease-fee-popup/capture-break-lease-fee-popup.component';
import { CaptureConditionsForRequestApprovalComponent } from './capture-conditions-for-request-approval/capture-conditions-for-request-approval.component';
import { CaptureInspectionActionComponent } from './capture-inspection-action/capture-inspection-action.component';
import { CaptureInspectionActionPopUpComponent } from './capture-inspection-action/components/capture-inspection-action-popup/capture-inspection-action-popup.component';
import { CaptureLeaseTermsComponent } from './capture-lease-terms/capture-lease-terms.component';
import { LeaseTermsPopupComponent } from './capture-lease-terms/leas-terms-popup/lease-terms-popup.component';
import { CapturePetBondComponent } from './capture-pet-bond/capture-pet-bond.component';
import { EventNameComponent } from './components/select-event-popup/components/event-name/event-name.component';
import { EventRowComponent } from './components/select-event-popup/components/event-row/event-row.component';
import { SelectEventPopupComponent } from './components/select-event-popup/select-event-popup.component';
import { EntryReportDeadlineComponent } from './entry-report-deadline/entry-report-deadline.component';
import { LettingRecommendationFormComponent } from './letting-recommendation/components/letting-recommendation-form/letting-recommendation-form.component';
import { LettingRecommendationComponent } from './letting-recommendation/letting-recommendation.component';
import { NoticeToLeaveComponent } from './notice-to-leave/notice-to-leave.component';
import { ScheduleReminderComponent } from './schedule-reminder/schedule-reminder/schedule-reminder.component';
import { SendAttachmentComponent } from './send-attachmant/send-attachment/send-attachment.component';
import { SendBasicEmailComponent } from './send-basic-email/send-basic-email.component';
import { SendCalendarEventComponent } from './send-calendar-event/send-calendar-event.component';
import { SendContactCardComponent } from './send-contact-card/send-contact-card.component';
import { SendConversationFileComponent } from './send-conversation-file/send-conversation-file.component';
import { SendRequestComponent } from './send-request/send-request.component';
import { StepBaseComponent } from './step-base/step-base.component';
import { PreventButtonModule } from '@trudi-ui';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [
    StepBaseComponent,
    SendBasicEmailComponent,
    SendAttachmentComponent,
    SendCalendarEventComponent,
    SelectEventPopupComponent,
    EventRowComponent,
    EventNameComponent,
    SendConversationFileComponent,
    SendRequestComponent,
    ScheduleReminderComponent,
    SendContactCardComponent,
    SendConversationFileComponent,
    ApplicationShortlistComponent,
    BondReturnSummaryComponent,
    BondAmountDueComponent,
    EntryReportDeadlineComponent,
    LettingRecommendationComponent,
    LettingRecommendationFormComponent,
    CapturePetBondComponent,
    CaptureConditionsForRequestApprovalComponent,
    CaptureBreakLeaseFeeComponent,
    CaptureBreakLeaseFeePopUpComponent,
    CaptureLeaseTermsComponent,
    LeaseTermsPopupComponent,
    CaptureInspectionActionComponent,
    CaptureInspectionActionPopUpComponent,
    CaptureAmountOwingToVacateComponent,
    NoticeToLeaveComponent
  ],
  exports: [
    SendBasicEmailComponent,
    SendAttachmentComponent,
    SendCalendarEventComponent,
    ScheduleReminderComponent,
    EventRowComponent,
    EventNameComponent,
    SelectEventPopupComponent,
    SendContactCardComponent,
    SendConversationFileComponent,
    SendConversationFileComponent,
    SendRequestComponent,
    ApplicationShortlistComponent,
    BondReturnSummaryComponent,
    SendRequestComponent,
    BondAmountDueComponent,
    EntryReportDeadlineComponent,
    LettingRecommendationComponent,
    CapturePetBondComponent,
    CaptureConditionsForRequestApprovalComponent,
    CaptureBreakLeaseFeeComponent,
    CaptureBreakLeaseFeePopUpComponent,
    CaptureLeaseTermsComponent,
    CaptureInspectionActionComponent,
    CaptureInspectionActionPopUpComponent,
    CaptureAmountOwingToVacateComponent,
    NoticeToLeaveComponent
  ],
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
    TenantVacateModule,
    NzToolTipModule,
    PreventButtonModule,
    RxPush
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CommunicationModule {}
