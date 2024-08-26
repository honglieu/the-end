import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TaskRowComponent } from './components/task-row/task-row.component';
import { TrudiUiModule } from '@trudi-ui';
import { SharedModule } from '@shared/shared.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { ForwardViaEmailModule } from '@/app/task-detail/components/forward-via-email/forward-via-email.module';
import { TaskGroupComponent } from './components/task-group/task-group.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { GroupColorPickerComponent } from './components/group-color-picker/group-color-picker.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DefaultTaskListComponent } from './views/default-task-list/default-task-list.component';
import { DefaultTaskListService } from './services/default-task-list.service';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { SharedModule as InboxSharedModule } from '@/app/dashboard/modules/inbox/shared/shared.module';
import { TaskDragDropService } from './services/task-drag-drop.service';
import { CompletedGroupComponent } from './components/completed-group/completed-group.component';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { WorkflowStepComponent } from './components/task-row/components/workflow-step/workflow-step.component';
import { TaskActionDropdownComponent } from './components/task-row/components/task-action-dropdown/task-action-dropdown.component';
import { TaskActionDropdownService } from './services/task-action-dropdown.service';
import { RxFor } from '@rx-angular/template/for';
import { RxLet } from '@rx-angular/template/let';
import { RxIf } from '@rx-angular/template/if';
import { FolderTaskListComponent } from '@/app/dashboard/modules/task-page/views/folder-task-list/folder-task-list.component';
import { TaskPageRoutingModule } from '@/app/dashboard/modules/task-page/task-page-routing.module';
import { TaskPreviewModule } from '@/app/dashboard/modules/task-page/modules/task-preview/task-preview.module';
import { TaskDragDropApiService } from '@/app/dashboard/modules/task-page/services/task-drag-drop-api.service';
import { TaskSidebarItemComponent } from '@/app/dashboard/modules/task-page/views/task-sidebar-item/task-sidebar-item.component';
import { TaskSidebarComponent } from '@/app/dashboard/modules/task-page/views/task-sidebar/task-sidebar.component';
import { TrudiDatePickerModule } from '@trudi-ui';
import { DashboardSharedModule } from '@/app/dashboard/shared/dashboard-shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { PortalModule } from '@angular/cdk/portal';
import { UserSharedModule } from '@/app/user/shared/user-shared.module';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzTreeModule } from 'ng-zorro-antd/tree';
import { NzTreeViewModule } from 'ng-zorro-antd/tree-view';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { CdkTreeModule } from '@angular/cdk/tree';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { TaskFolderInputComponent } from '@/app/dashboard/modules/task-page/components/task-folder-input/task-folder-input.component';
import { FolderTaskListService } from '@/app/dashboard/modules/task-page/services/folder-task-list.service';

@NgModule({
  declarations: [
    FolderTaskListComponent,
    TaskRowComponent,
    TaskGroupComponent,
    GroupColorPickerComponent,
    DefaultTaskListComponent,
    WorkflowStepComponent,
    CompletedGroupComponent,
    TaskActionDropdownComponent,
    TaskSidebarComponent,
    TaskSidebarItemComponent,
    TaskFolderInputComponent
  ],
  imports: [
    TaskPageRoutingModule,
    ForwardViaEmailModule,
    InboxSharedModule,
    NzPopoverModule,
    TaskPreviewModule,
    RxFor,
    RxLet,
    RxIf,
    TrudiDatePickerModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TrudiUiModule,
    DashboardSharedModule,
    NzDropDownModule,
    NzMenuModule,
    NgSelectModule,
    SharedModule,
    PortalModule,
    NzSkeletonModule,
    UserSharedModule,
    NzToolTipModule,
    NzRadioModule,
    NzDividerModule,
    NzAvatarModule,
    TrudiSendMsgModule,
    DragDropModule,
    MoveMessToDifferentTaskModule,
    NzCollapseModule,
    NzTreeModule,
    NzTreeViewModule,
    NzTreeSelectModule,
    ScrollingModule,
    CdkTreeModule,
    CustomPipesModule
  ],
  providers: [
    TaskDragDropApiService,
    DefaultTaskListService,
    TaskDragDropService,
    TaskActionDropdownService,
    FolderTaskListService
  ]
})
export class TaskPageModule {}
