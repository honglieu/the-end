import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TaskTemplateListViewRoutingModule } from './task-template-list-view-routing.module';
import { TrudiUiModule } from '@trudi-ui';
import { SharedModule as SharedAppModule } from '@shared/shared.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { PortalModule } from '@angular/cdk/portal';

import { TaskTemplateListViewComponent } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/task-template-list-view.component';
import { TaskEditorSearchComponent } from '@/app/dashboard/modules/task-editor/components/task-editor-search/task-editor-search.component';
import { TaskEditorHeaderComponent } from '@/app/dashboard/modules/task-editor/components/task-editor-header/task-editor-header.component';
import { CreateTaskEditorPopupComponent } from '@/app/dashboard/modules/task-editor/components/create-task-editor-popup/create-task-editor-popup.component';
import { CreateFromTemplateComponent } from '@/app/dashboard/modules/task-editor/components/create-task-editor-popup/create-from-template/create-from-template.component';
import { CreateFromScratchComponent } from '@/app/dashboard/modules/task-editor/components/create-task-editor-popup/create-from-scratch/create-from-scratch.component';

import { PortalCreateFromScratchService } from './services/portal/create-from-scratch.portal.service';
import { PortalTaskEditorApiService } from './services/portal/task-editor-api.portal.service';
import { PortalTaskEditorFilterService } from './services/portal/task-editor-filter.portal.service';
import { TaskEditorListViewService } from './services/task-editor-list-view.service';
import { ConsoleTaskEditorApiService } from './services/console/task-editor-api.console.service';
import { ConsoleCreateFromScratchService } from './services/console/create-from-scratch.console.service';
import { SelectCrmCreateTaskEditorComponent } from '@/app/dashboard/modules/task-editor/components/select-crm-create-task-editor/select-crm-create-task-editor.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { SharedModule } from '@/app/dashboard/modules/task-editor/shared/shared.module';

import { TaskEditorApiService } from '@/app/dashboard/modules/task-editor/services/task-editor-api.service';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTrimPipe } from 'ng-zorro-antd/pipes';
@NgModule({
  declarations: [
    TaskTemplateListViewComponent,
    TaskEditorSearchComponent,
    TaskEditorHeaderComponent,
    CreateTaskEditorPopupComponent,
    SelectCrmCreateTaskEditorComponent,
    CreateFromTemplateComponent,
    CreateFromScratchComponent
  ],
  imports: [
    CommonModule,
    TaskTemplateListViewRoutingModule,
    TrudiUiModule,
    SharedAppModule,
    ScrollingModule,
    PortalModule,
    InfiniteScrollModule,
    NzSkeletonModule,
    SharedModule,
    NzToolTipModule,
    NzTrimPipe
  ],
  providers: [
    TaskEditorListViewService,
    PortalTaskEditorApiService,
    PortalTaskEditorApiService,
    PortalCreateFromScratchService,
    PortalTaskEditorFilterService,
    ConsoleTaskEditorApiService,
    ConsoleCreateFromScratchService,
    TaskEditorApiService
  ]
})
export class TaskTemplateListViewModule {}
