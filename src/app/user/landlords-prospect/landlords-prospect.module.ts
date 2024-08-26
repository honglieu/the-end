import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { LandlordsProspectComponent } from './landlords-prospect.component';
import { TenantProspectRoutingModule } from './landlords-prospect-routing.module';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { PropertyProfileModule } from '@shared/components/property-profile/property-profile.module';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    TenantProspectRoutingModule,
    NzSkeletonModule,
    ShareModuleUserModule,
    TrudiSendMsgModule,
    PropertyProfileModule
  ],
  declarations: [LandlordsProspectComponent]
})
export class LandlordsProspectModule {}
