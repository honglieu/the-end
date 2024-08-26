import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LinkTaskComponent } from './link-task/link-task.component';
import { TrudiUiModule } from '@trudi-ui';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';
import { LinkTaskService } from './services/link-task.service';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';

@NgModule({
  declarations: [LinkTaskComponent],
  exports: [LinkTaskComponent],
  imports: [
    CommonModule,
    TrudiUiModule,
    SharePopUpModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    MoveMessToDifferentTaskModule
  ],
  providers: [LinkTaskService]
})
export class LinkTaskModule {}
