import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskTemplateDetailsHeaderComponent } from './task-template-details-header.component';
import { TrudiUiModule } from '@trudi-ui';
import { DashboardSharedModule } from '@/app/dashboard/shared/dashboard-shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { DropdownTemplateStatusComponent } from './components/dropdown-template-status/dropdown-template-status.component';
import { TaskTemplateSettingsComponent } from './components/task-template-settings/task-template-settings.component';
import { SharedModule as TaskEditorSharedModule } from '@/app/dashboard/modules/task-editor/shared/shared.module';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [
    TaskTemplateDetailsHeaderComponent,
    DropdownTemplateStatusComponent,
    TaskTemplateSettingsComponent
  ],
  imports: [
    SharedModule,
    FormsModule,
    CommonModule,
    TrudiUiModule,
    NzToolTipModule,
    ReactiveFormsModule,
    DashboardSharedModule,
    TaskEditorSharedModule,
    NzSkeletonModule
  ],
  exports: [TaskTemplateDetailsHeaderComponent]
})
export class TaskTemplateDetailsHeaderModule {}
