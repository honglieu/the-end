import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { SharedModule } from '@shared/shared.module';
import { TrudiModule } from '@/app/task-detail/modules/trudi/trudi.module';
import { ControlPanelComponent } from './control-panel.component';
import { ControlPanelService } from './services/control-panel.service';

@NgModule({
  declarations: [ControlPanelComponent],
  imports: [
    CommonModule,
    SharedModule,
    DragDropModule,
    TrudiModule,
    NzSkeletonModule
  ],
  exports: [ControlPanelComponent],
  providers: [ControlPanelService]
})
export class SidebarLeftModule {}
