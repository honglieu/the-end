import { NgModule } from '@angular/core';
import { NewTaskComponent } from './new-task.component';
import { SharedModule } from '@/app/task-detail/modules/steps/shared/shared.module';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [SharedModule, SharePopUpModule, CommonModule],
  declarations: [NewTaskComponent],
  exports: [NewTaskComponent]
})
export class NewTaskModule {}
