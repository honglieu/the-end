import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssignAttachBoxComponent } from './assign-attach-box.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ScrollingModule as ExperimentalScrollingModule } from '@angular/cdk-experimental/scrolling';
import { UserAvatarModule } from '@shared/components/user-avatar/user-avatar.module';
import { TdCheckboxAssignComponent } from './td-checkbox/td-checkbox.component';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [AssignAttachBoxComponent, TdCheckboxAssignComponent],
  exports: [AssignAttachBoxComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ScrollingModule,
    ExperimentalScrollingModule,
    UserAvatarModule,
    TrudiUiModule
  ]
})
export class AssignAttachBoxModule {}
