import { AreaAppointmentComponent } from './../trudi/area-appointment/area-appointment.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule, TitleCasePipe } from '@angular/common';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule
} from '@angular/core';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TrudiDatePickerModule } from '@shared/components/date-picker2/date-picker.module';
import { SharedModule as SharedAppModule } from '@shared/shared.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TrudiUiModule } from '@trudi-ui';
import { ForwardViaEmailModule } from '@/app/task-detail/components/forward-via-email/forward-via-email.module';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { SharedModule } from '@/app/task-detail/modules/sidebar-left/shared/shared.module';
import { FilesComponent } from './components/files/files.component';
import { DetailsSectionComponent } from './components/message-detail-section/details-section/details-section.component';
import { MessageDetailSectionComponent } from './components/message-detail-section/message-detail-section.component';
import { EventNameComponent } from './components/select-event-popup/components/event-name/event-name.component';
import { EventRowComponent } from './components/select-event-popup/components/event-row/event-row.component';
import { SelectEventPopupComponent } from './components/select-event-popup/select-event-popup.component';
import { ConversationComponent } from './components/tab-panel/conversations/conversations.component';
import { TabPanelComponent } from './components/tab-panel/tab-panel.component';
import { WidgetAttachmentsComponent } from './components/widget-attachments/widget-attachments.component';
import { WidgetCalendarComponent } from './components/widget-calendar/widget-calendar.component';
import { WidgetCallsComponent } from './components/widget-calls/widget-calls.component';
import { WidgetPropertyTreeModule } from './components/widget-property-tree/widget-property-tree.module';
import { WidgetReiFormComponent } from './components/widget-rei-form/widget-rei-form.component';
import { WidgetRentManagerModule } from './modules/widget-rent-manager/widget-rent-manager.module';
import { DocumentItemComponent } from './shared/trudi-document-item/trudi-document-item.component';
import { SidebarRightComponent } from './sidebar-right.component';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { PreventButtonModule } from '@trudi-ui';
import { CustomDirectivesModule } from '@shared/directives/custom-directive.module';
import { RxFor } from '@rx-angular/template/for';
import { TaskDetailCustomPipesModule } from '@/app/task-detail/pipes/task-detail-custom-pipes.module';
import { PopupWidgetReiFormComponent } from './components/widget-rei-form/components/popup-widget-rei-form/popup-widget-rei-form.component';
import { PopupWidgetCalendarComponent } from './components/widget-calendar/components/popup-widget-calendar/popup-widget-calendar.component';
import { WidgetLinkedComponent } from './components/widget-linked/widget-linked.component';
import { RxPush } from '@rx-angular/template/push';
import { WidgetLinkedContentComponent } from './components/widget-linked/components/widget-linked-content/widget-linked-content.component';
import { WidgetLinkedFileComponent } from './components/widget-linked/components/widget-linked-file/widget-linked-file.component';
import { RxLet } from '@rx-angular/template/let';
import { RxIf } from '@rx-angular/template/if';

@NgModule({
  declarations: [
    DocumentItemComponent,
    SidebarRightComponent,
    MessageDetailSectionComponent,
    DetailsSectionComponent,
    TabPanelComponent,
    FilesComponent,
    ConversationComponent,
    WidgetCallsComponent,
    WidgetAttachmentsComponent,
    WidgetLinkedContentComponent,
    WidgetReiFormComponent,
    WidgetCalendarComponent,
    SelectEventPopupComponent,
    EventRowComponent,
    EventNameComponent,
    WidgetLinkedComponent,
    PopupWidgetReiFormComponent,
    PopupWidgetCalendarComponent,
    WidgetLinkedFileComponent
  ],
  imports: [
    CommonModule,
    TrudiUiModule,
    SharedAppModule,
    DragDropModule,
    TrudiSendMsgModule,
    NzToolTipModule,
    MoveMessToDifferentTaskModule,
    NzSkeletonModule,
    ForwardViaEmailModule,
    NzDropDownModule,
    SharedModule,
    TrudiDatePickerModule,
    WidgetPropertyTreeModule,
    WidgetRentManagerModule,
    ScrollingModule,
    CustomPipesModule,
    PreventButtonModule,
    TaskDetailCustomPipesModule,
    CustomDirectivesModule,
    AreaAppointmentComponent,
    PreventButtonModule,
    RxFor,
    RxPush,
    RxLet,
    RxIf
  ],
  exports: [SidebarRightComponent],
  providers: [TitleCasePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class SidebarRightModule {}
