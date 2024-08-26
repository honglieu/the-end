import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header.component';
import { SharedModule } from '@shared/shared.module';
import { AutosizeModule } from 'ngx-autosize';
import { HeaderService } from '@services/header.service';
import { NotificationItemComponent } from '@shared/components/list-notification/components/notification-item/notification-item.component';
import { RouterModule } from '@angular/router';
import { TaskModule } from '@/app/task/task.module';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { InviteTeamMembersComponent } from './invite-team-members/invite-team-members.component';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReactiveFormsModule } from '@angular/forms';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [
    HeaderComponent,
    NotificationItemComponent,
    InviteTeamMembersComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AutosizeModule,
    RouterModule,
    NgSelectModule,
    ReactiveFormsModule,
    TaskModule,
    SharePopUpModule,
    NzToolTipModule,
    TrudiUiModule
  ],
  exports: [HeaderComponent, InviteTeamMembersComponent],
  providers: [HeaderService]
})
export class HeaderModule {}
