import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardSharedModule } from '@/app/dashboard/shared/dashboard-shared.module';
import { SharedModule } from '@shared/shared.module';
import { TrudiUiModule } from '@trudi-ui';
import { AddStepManagementComponent } from './components/add-step-management/add-step-management.component';
import { SelectStepTypeComponent } from './components/select-step-type/select-step-type.component';
import { ScheduleReminderComponent } from './modules/create-communication-step/components/schedule-remider/schedule-reminder.component';
import { SendAttachmentComponent } from './modules/create-communication-step/components/send-attachment/send-attachment.component';
import { SendContactCardComponent } from './modules/create-communication-step/components/send-contact-card/send-contact-card.component';
import { ConversationFileComponent } from './modules/create-communication-step/components/conversation-file/conversation-file.component';
import { TinyEditorContainerModule } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/tiny-editor-container/tiny-editor-container.module';
import { NzTreeModule } from 'ng-zorro-antd/tree';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzTreeViewModule } from 'ng-zorro-antd/tree-view';
import { CalendarEventComponent } from './modules/create-communication-step/components/calendar-event/calendar-event.component';
import { CommunicationStepFormComponent } from './modules/create-communication-step/components/communication-step-form/communication-step-form.component';
import { CreateCommunicationStepComponent } from './modules/create-communication-step/create-communication-step.component';
import { TaskTemplateDetailsContentComponent } from './task-template-details-content.component';
import { PropertyTreeStepModule } from './modules/property-tree-step/property-tree-step.module';
import { SaveChangeButtonComponent } from './components/save-change-button/save-change-button.component';
import { TrudiDecisionTreeModule } from './components/tree-view/trudi-decision-tree.module';
import { CalendarEventStepComponent } from './modules/calendar-event-step/calendar-event-step.component';
import { CalendarStepFormComponent } from './modules/calendar-event-step/components/calendar-step-form/calendar-step-form.component';
import { NewTaskStepComponent } from './modules/new-task-step/new-task-step.component';
import { NewTaskStepFormComponent } from './modules/new-task-step/new-task-step-form/new-task-step-form.component';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { SkeletonDetailsContentComponent } from './components/skeleton-details-content/skeleton-details-content.component';
import { BoundAmountDueComponent } from './modules/create-communication-step/components/bound-amount-due/bound-amount-due.component';
import { EntryReportDeadlineComponent } from './modules/create-communication-step/components/entry-report-deadline/entry-report-deadline.component';
import { CaptureBreakLeaseFeeComponent } from './modules/create-communication-step/components/capture-break-lease-fee/capture-break-lease-fee.component';
import { CaptureInspectionActionComponent } from './modules/create-communication-step/components/capture-inspection-action/capture-inspection-action.component';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { ApplicationShortlistComponent } from './modules/create-communication-step/components/application-shortlist/application-shortlist.component';
import { BondReturnSummaryComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/modules/create-communication-step/components/bond-return-summary/bond-return-summary.component';
import { LettingRecommendationComponent } from './modules/create-communication-step/components/letting-recommendation/letting-recommendation.component';
import { CapturePetBondComponent } from './modules/create-communication-step/components/capture-pet-bond/capture-pet-bond.component';
import { CaptureConditionsForRequestApprovalComponent } from './modules/create-communication-step/components/capture-conditions-for-request-approval/capture-conditions-for-request-approval.component';
import { CaptureLeaseTermsComponent } from './modules/create-communication-step/components/capture-lease-terms/capture-lease-terms.component';
import { CaptureAmountOwingToVacateComponent } from './modules/create-communication-step/components/capture-amount-owing-to-vacate/capture-amount-owing-to-vacate.component';
import { RentManagerStepModule } from './modules/rent-manager-step/rent-manager-step.module';
import { NoticeToLeaveComponent } from './modules/create-communication-step/components/notice-to-leave/notice-to-leave.component';
import { EditPublishedTaskToastComponent } from './components/edit-published-task-toast/edit-published-task-toast.component';
import { CheckListStepComponent } from './modules/check-list-step/check-list-step.component';
import { SelectReceiverModule } from '@shared/components/select-receiver/select-receiver.module';

@NgModule({
  declarations: [
    CheckListStepComponent,
    TaskTemplateDetailsContentComponent,
    CreateCommunicationStepComponent,
    CommunicationStepFormComponent,
    AddStepManagementComponent,
    CalendarEventComponent,
    SelectStepTypeComponent,
    ScheduleReminderComponent,
    SendAttachmentComponent,
    ConversationFileComponent,
    TaskTemplateDetailsContentComponent,
    SendContactCardComponent,
    ConversationFileComponent,
    SaveChangeButtonComponent,
    CalendarEventStepComponent,
    CalendarStepFormComponent,
    SkeletonDetailsContentComponent,
    BoundAmountDueComponent,
    EntryReportDeadlineComponent,
    BondReturnSummaryComponent,
    ApplicationShortlistComponent,
    LettingRecommendationComponent,
    CapturePetBondComponent,
    CaptureConditionsForRequestApprovalComponent,
    CaptureLeaseTermsComponent,
    CaptureBreakLeaseFeeComponent,
    CaptureInspectionActionComponent,
    CaptureAmountOwingToVacateComponent,
    NewTaskStepComponent,
    NewTaskStepFormComponent,
    NoticeToLeaveComponent,
    EditPublishedTaskToastComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TrudiUiModule,
    TinyEditorContainerModule,
    SharedModule,
    DashboardSharedModule,
    CommonModule,
    NzTreeModule,
    NzDropDownModule,
    NzMenuModule,
    NzTreeViewModule,
    PropertyTreeStepModule,
    RentManagerStepModule,
    TrudiDecisionTreeModule,
    NgOptionHighlightModule,
    NzSkeletonModule,
    TrudiDatePickerModule,
    SelectReceiverModule
  ],
  exports: [
    TaskTemplateDetailsContentComponent,
    TrudiUiModule,
    FormsModule,
    ReactiveFormsModule,
    TinyEditorContainerModule,
    SharedModule,
    DashboardSharedModule,
    SaveChangeButtonComponent
  ],
  providers: [TaskEditorService]
})
export class TaskTemplateDetailsContentModule {}
