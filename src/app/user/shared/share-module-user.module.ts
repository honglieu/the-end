import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableUserSharedComponent } from './components/table-user-shared/table-user-shared.component';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@shared/shared.module';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { FormsModule } from '@angular/forms';
import { AppCommonAgentUserComponent } from './components/common-agent-user-component/common-agent-user-component.component';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { UserInfoDrawerComponent } from './components/drawer-user-info/user-info-drawer.component';
import { LeaseUserInfoComponent } from './components/drawer-user-info/components/lease-user-info/lease-user-info.component';
import { CardUserInfoComponent } from './components/drawer-user-info/components/card-user-info/card-user-info.component';
import { UserHeaderToolbarComponent } from './components/drawer-user-info/components/user-header-toolbar/user-header-toolbar.component';
import { UserAvatarModule } from '@shared/components/user-avatar/user-avatar.module';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { ListUserPropertyComponent } from './components/drawer-user-info/components/list-user-property/list-user-property.component';
import { ListUserEmailComponent } from './components/drawer-user-info/components/list-user-email/list-user-email.component';
import { CallRequestComponent } from './components/drawer-user-info/components/call-request/call-request.component';
import { ProfileCardComponent } from './components/drawer-user-info/components/profile-card/profile-card.component';
import { TrudiUiModule } from '@trudi-ui';
@NgModule({
  declarations: [
    TableUserSharedComponent,
    AppCommonAgentUserComponent,
    UserInfoDrawerComponent,
    CardUserInfoComponent,
    LeaseUserInfoComponent,
    UserHeaderToolbarComponent,
    ListUserPropertyComponent,
    ListUserEmailComponent,
    CallRequestComponent,
    ProfileCardComponent
  ],
  imports: [
    CommonModule,
    NzSkeletonModule,
    NgSelectModule,
    SharedModule,
    NzDropDownModule,
    NzMenuModule,
    FormsModule,
    TrudiSendMsgModule,
    ScrollingModule,
    InfiniteScrollModule,
    UserAvatarModule,
    NzProgressModule,
    TrudiUiModule
  ],
  exports: [
    TableUserSharedComponent,
    AppCommonAgentUserComponent,
    UserInfoDrawerComponent,
    CardUserInfoComponent,
    LeaseUserInfoComponent,
    UserHeaderToolbarComponent,
    ListUserPropertyComponent,
    ListUserEmailComponent,
    CallRequestComponent,
    ProfileCardComponent
  ]
})
export class ShareModuleUserModule {}
