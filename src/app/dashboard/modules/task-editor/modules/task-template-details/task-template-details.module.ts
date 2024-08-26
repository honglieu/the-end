import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskTemplateDetailsRoutingModule } from './task-template-details-routing.module';
import { TaskTemplateDetailsHeaderModule } from './modules/task-template-details-header/task-template-details-header.module';
import { TaskTemplateDetailsContentModule } from './modules/task-template-details-content/task-template-details-content.module';
import { TinyEditorContainerModule } from './modules/tiny-editor-container/tiny-editor-container.module';
import { TrudiUiModule } from '@trudi-ui';
import { SharedModule as SharedAppModule } from '@shared/shared.module';
import { TaskEditorListViewService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/task-editor-list-view.service';
import { TaskEditorApiService } from '@/app/dashboard/modules/task-editor/services/task-editor-api.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TaskTemplateDetailsHeaderModule,
    TaskTemplateDetailsContentModule,
    TaskTemplateDetailsRoutingModule,
    TinyEditorContainerModule,
    TrudiUiModule,
    SharedAppModule
  ],
  providers: [TaskEditorListViewService, TaskEditorApiService]
})
export class TaskTemplateDetailsModule {}
