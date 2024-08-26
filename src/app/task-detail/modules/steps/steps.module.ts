import { AreaAppointmentComponent } from './../trudi/area-appointment/area-appointment.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepsComponent } from './steps.component';
import { CommunicationModule } from './communication/communication.module';
import { CalendarEventModule } from './calendar-event/calendarEvent.module';
import { SharedModule } from './shared/shared.module';
import { PropertyTreeBaseModule } from './property-tree/property-tree.module';
import { TrudiUiModule } from '@trudi-ui';
import { StepComponent } from './modules/step/step.component';
import { ListStepComponent } from './modules/list-step/list-step.component';
import { SharedModule as SharedAppModule } from '@shared/shared.module';
import { NewTaskModule } from './new-task/new-task.module';
import { RentManagerBaseModule } from './rent-manager/rent-manager.module';
import { CheckListComponent } from './check-list/check-list.component';
import { TinyEditorContainerModule } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/tiny-editor-container/tiny-editor-container.module';
import { TrudiAddContactCardModule } from '@shared/components/trudi-add-contact-card/trudi-add-contact-card.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { RxFor } from '@rx-angular/template/for';
import { TrudiSectionComponent } from './shared/trudi-section/trudi-section.component';
import { TrudiDecisionComponent } from './shared/trudi-decision/trudi-decision.component';
import { PreventButtonModule } from '@trudi-ui';
import { CommentsComponent } from './components/step-details-panel/components/comments/comments.component';
import { CtaButtonsComponent } from './components/cta-buttons/cta-buttons.component';
import { SummaryComponent } from './components/step-details-panel/components/summary/summary.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { StepDetailsPanelComponent } from './components/step-details-panel/step-details-panel.component';
import { CommunicationStepSummaryComponent } from './components/step-details-panel/components/summary/components/communication-step-summary/communication-step-summary.component';
import { ChecklistStepSummaryComponent } from './components/step-details-panel/components/summary/components/checklist-step-summary/checklist-step-summary.component';
import { CalendarStepSummaryComponent } from './components/step-details-panel/components/summary/components/calendar-step-summary/calendar-step-summary.component';
import { PreviewEmailComponent } from './components/step-details-panel/components/summary/components/communication-step-summary/components/preview-email/preview-email.component';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { NewTaskStepSummaryComponent } from './components/step-details-panel/components/summary/components/new-task-step-summary/new-task-step-summary.component';
import { CRMStepSummaryComponent } from './components/step-details-panel/components/summary/components/crm-step-summary/crm-step-summary.component';
import { RxPush } from '@rx-angular/template/push';
import { CommentsEditorComponent } from './components/step-details-panel/components/comments/comments-editor/comments-editor.component';
import { CommentsThreadsComponent } from './components/step-details-panel/components/comments/comments-threads/comments-threads.component';
import { CommentsThreadComponent } from './components/step-details-panel/components/comments/comments-thread/comments-thread.component';
import { UserAvatarModule } from '@shared/components/user-avatar/user-avatar.module';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { EditorModule } from '@tinymce/tinymce-angular';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { CommentsAttachmentComponent } from '@/app/task-detail/modules/steps/components/step-details-panel/components/comments/comments-attachment-item/comments-attachment-item.component';
import { CommentsAttachmentsComponent } from '@/app/task-detail/modules/steps/components/step-details-panel/components/comments/comments-attachments/comments-attachments.component';
import { CommentSkeletonComponent } from './components/step-details-panel/components/comments/comment-skeleton/comment-skeleton.component';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { ComponentDescriptionPipe } from '@/app/task-detail/pipes/component-description.pipe';
import { CommentsFetchingComponent } from '@/app/task-detail/modules/steps/components/step-details-panel/components/comments/comments-fetching/comments-fetching.component';

@NgModule({
  declarations: [
    StepsComponent,
    ListStepComponent,
    StepDetailsPanelComponent,
    SummaryComponent,
    CommunicationStepSummaryComponent,
    PreviewEmailComponent,
    ChecklistStepSummaryComponent,
    CalendarStepSummaryComponent,
    NewTaskStepSummaryComponent,
    CRMStepSummaryComponent,
    CommentsComponent,
    StepComponent,
    CheckListComponent,
    TrudiSectionComponent,
    TrudiDecisionComponent,
    ComponentDescriptionPipe,
    CommentsEditorComponent,
    CommentsThreadComponent,
    CommentsThreadsComponent,
    CommentsAttachmentComponent,
    CommentsAttachmentsComponent,
    CommentSkeletonComponent,
    CommentsFetchingComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    SharedAppModule,
    CommunicationModule,
    CalendarEventModule,
    PropertyTreeBaseModule,
    RentManagerBaseModule,
    TrudiUiModule,
    NewTaskModule,
    TinyEditorContainerModule,
    TrudiAddContactCardModule,
    TrudiSendMsgModule,
    RxFor,
    PreventButtonModule,
    NzDropDownModule,
    CtaButtonsComponent,
    CdkAccordionModule,
    RxPush,
    CtaButtonsComponent,
    UserAvatarModule,
    InfiniteScrollModule,
    EditorModule,
    PickerComponent,
    NzSkeletonModule,
    AreaAppointmentComponent
  ],
  exports: [StepsComponent]
})
export class StepsModule {}
