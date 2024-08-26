import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { TaskPreviewComponent } from './task-preview.component';
import { CalendarPreviewComponent } from './components/calendar-preview/calendar-preview.component';
import { NotesPreviewComponent } from './components/notes-preview/notes-preview.component';
import { ConversationsPreviewComponent } from './components/conversations-preview/conversations-preview.component';
import { ProgressPreviewComponent } from './components/progress-preview/progress-preview.component';
import { TaskHeaderPreviewComponent } from './components/task-header-preview/task-header-preview.component';
import { TrudiUiModule } from '@trudi-ui';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { ParticipantPipe } from './pipe/format-participant-name.pipe';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { ConversationItemComponent } from './components/conversations-preview/components/conversation-item/conversation-item.component';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { RxFor } from '@rx-angular/template/for';
import { RxLet } from '@rx-angular/template/let';
import { RxIf } from '@rx-angular/template/if';
import { SharedModule } from '@shared/shared.module';
import { TaskDetailModule } from '@/app/task-detail/task-detail.module';
import { PreventButtonModule } from '@trudi-ui';
import { PropertyProfileModule } from '@shared/components/property-profile/property-profile.module';

@NgModule({
  declarations: [
    TaskPreviewComponent,
    CalendarPreviewComponent,
    NotesPreviewComponent,
    ConversationsPreviewComponent,
    ProgressPreviewComponent,
    TaskHeaderPreviewComponent,
    ParticipantPipe,
    ConversationItemComponent
  ],
  imports: [
    CommonModule,
    TrudiUiModule,
    CustomPipesModule,
    NzSkeletonModule,
    DragDropModule,
    FormsModule,
    ReactiveFormsModule,
    MoveMessToDifferentTaskModule,
    SharePopUpModule,
    NzToolTipModule,
    NzDropDownModule,
    RxFor,
    RxLet,
    RxIf,
    TaskDetailModule,
    SharedModule,
    PreventButtonModule,
    PropertyProfileModule
  ],
  exports: [
    TaskPreviewComponent,
    ProgressPreviewComponent,
    CalendarPreviewComponent
  ]
})
export class TaskPreviewModule {}
