import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OtherContactComponent } from './other-contact.component';
import { SharedModule } from '@shared/shared.module';
import { OtherContactService } from '@services/orther-contact.service';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { OtherContactRoutingModule } from './other-contact-routing.module';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { TaskTemplateListViewModule } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/task-template-list-view.module';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [OtherContactComponent],
  providers: [OtherContactService],
  imports: [
    CommonModule,
    SharedModule,
    SharePopUpModule,
    OtherContactRoutingModule,
    NzSkeletonModule,
    TaskTemplateListViewModule,
    ShareModuleUserModule,
    TrudiUiModule
  ]
})
export class OtherContactModule {}
