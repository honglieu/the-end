import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TaskEditorRoutingModule } from './task-editor-routing.module';
import { TaskEditorComponent } from './task-editor.component';
import { TrudiUiModule } from '@trudi-ui';
import { SharedModule as SharedAppModule } from '@shared/shared.module';
import { TaskTemplateDetailsComponent } from './modules/task-template-details/task-template-details.component';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { TaskTemplateDetailsContentModule } from './modules/task-template-details/modules/task-template-details-content/task-template-details-content.module';
import { TaskTemplateDetailsHeaderModule } from './modules/task-template-details/modules/task-template-details-header/task-template-details-header.module';
import { TaskEditorService } from './services/task-editor.service';
import { SharedModule } from './shared/shared.module';
import { HelpDocumentPopupComponent } from './components/help-document-popup/help-document-popup.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
@NgModule({
  declarations: [
    TaskEditorComponent,
    TaskTemplateDetailsComponent,
    HelpDocumentPopupComponent
  ],
  providers: [TaskEditorService],
  imports: [
    CommonModule,
    TaskEditorRoutingModule,
    SharedAppModule,
    TrudiUiModule,
    NzSkeletonModule,
    TaskTemplateDetailsContentModule,
    TaskTemplateDetailsHeaderModule,
    SharedModule,
    AngularSvgIconModule
  ]
})
export class TaskEditorModule {}
