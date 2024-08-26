import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskEditorToolbarComponent } from '@/app/dashboard/modules/task-editor/components/task-editor-toolbar/task-editor-toolbar.component';
import { UpgradeMessageModule } from '@shared/components/upgrade-message/upgrade-message.module';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [TaskEditorToolbarComponent],
  imports: [CommonModule, TrudiUiModule, UpgradeMessageModule, NzToolTipModule],
  exports: [TaskEditorToolbarComponent]
})
export class TaskEditorToolbarModule {}
