import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentUserComponent } from './agent-user.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SharedModule } from '@shared/shared.module';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { AgentUserRoutingModule } from './agent-user-routing.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { TenantsLandlordsPtComponent } from './component/tenants-landlords-pt/tenants-landlords-pt.component';
import { TenantsLandlordsRmComponent } from './component/tenants-landlords-rm/tenants-landlords-rm.component';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';
import { UserSharedModule } from '@/app/user/shared/user-shared.module';
import { HeaderFilterAgentUserComponent } from './component/header-filter-agent-user/header-filter-agent-user.component';
import { ListPropertyContactViewModule } from '@/app/user/list-property-contact-view/list-property-contact-view.module';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [
    AgentUserComponent,
    TenantsLandlordsPtComponent,
    TenantsLandlordsRmComponent,
    HeaderFilterAgentUserComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ScrollingModule,
    SharePopUpModule,
    TrudiSendMsgModule,
    AgentUserRoutingModule,
    NzSkeletonModule,
    ShareModuleUserModule,
    UserSharedModule,
    ListPropertyContactViewModule,
    TrudiUiModule
  ]
})
export class AgentUserModule {}
