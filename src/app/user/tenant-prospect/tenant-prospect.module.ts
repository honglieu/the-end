import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantProspectComponent } from './tenant-prospect.component';
import { TenantProspectRoutingModule } from './tenant-prospect-routing.module';
import { SharedModule } from '@shared/shared.module';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { ListPropertyContactViewModule } from '@/app/user/list-property-contact-view/list-property-contact-view.module';
import { PropertyProfileModule } from '@shared/components/property-profile/property-profile.module';

@NgModule({
  imports: [
    CommonModule,
    TenantProspectRoutingModule,
    SharedModule,
    ShareModuleUserModule,
    TrudiSendMsgModule,
    ListPropertyContactViewModule,
    PropertyProfileModule
  ],
  declarations: [TenantProspectComponent]
})
export class TenantProspectModule {}
