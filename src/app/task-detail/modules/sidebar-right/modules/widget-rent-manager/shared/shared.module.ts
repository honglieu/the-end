import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SyncStatusComponent } from './components/sync-status/sync-status.component';
import { TrudiUiModule } from '@trudi-ui';
import { AttachFileButtonComponent } from './components/attach-file-button/attach-file-button.component';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { FormatTypeFilePipe } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/pipes/format-type-file.pipe';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@NgModule({
  declarations: [
    SyncStatusComponent,
    AttachFileButtonComponent,
    FormatTypeFilePipe
  ],
  imports: [CommonModule, TrudiUiModule, CustomPipesModule, NzToolTipModule],
  exports: [SyncStatusComponent, AttachFileButtonComponent, FormatTypeFilePipe]
})
export class SharedModule {}
