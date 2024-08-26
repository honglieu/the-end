import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropdownGroupComponent } from './dropdown-group/dropdown-group.component';
import { GroupItemComponent } from './dropdown-group/group-item/group-item.component';
import { MoveMessToDifferentTaskDetailComponent } from './move-mess-to-different-task.component';
import { SharedModule } from '@shared/shared.module';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { MoveMessToDifferentService } from '@/app/task-detail/components/move-mess-to-different-task/services/move-mess-to-different-task.service';
import { OptionCreateTaskMultipleModalComponent } from './option-create-task-multiple-modal/option-create-task-multiple-modal.component';
import { TaskDetailService } from '@/app/task-detail/services/task-detail.service';
import { RxPush } from '@rx-angular/template/push';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [
    GroupItemComponent,
    DropdownGroupComponent,
    MoveMessToDifferentTaskDetailComponent,
    OptionCreateTaskMultipleModalComponent
  ],
  exports: [
    GroupItemComponent,
    DropdownGroupComponent,
    MoveMessToDifferentTaskDetailComponent,
    OptionCreateTaskMultipleModalComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    NzSkeletonModule,
    RxPush,
    TrudiUiModule
  ],
  providers: [MoveMessToDifferentService, TaskDetailService]
})
export class MoveMessToDifferentTaskModule {}
