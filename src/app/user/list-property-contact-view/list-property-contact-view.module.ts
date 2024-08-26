import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListPropertyContactViewComponent } from './list-property-contact-view.component';
import { FormsModule } from '@angular/forms';
import { DashboardSharedModule } from '@/app/dashboard/shared/dashboard-shared.module';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';
import { SharedModule } from '@shared/shared.module';
import { ContactPropertyRowComponent } from './components/contact-property-row/contact-property-row.component';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { PropertyUnitItemComponent } from './components/property-unit-item/property-unit-item.component';
import { TenantOwnerItemComponent } from './components/tenancy-ownership-item/tenancy-ownership-item.component';
import { PropertyProfileModule } from '@shared/components/property-profile/property-profile.module';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [
    ListPropertyContactViewComponent,
    ContactPropertyRowComponent,
    PropertyUnitItemComponent,
    TenantOwnerItemComponent
  ],
  imports: [
    TrudiSendMsgModule,
    CommonModule,
    FormsModule,
    CommonModule,
    DashboardSharedModule,
    ShareModuleUserModule,
    SharedModule,
    NzSkeletonModule,
    ScrollingModule,
    SharedModule,
    PropertyProfileModule,
    TrudiUiModule
  ],
  exports: [ListPropertyContactViewComponent]
})
export class ListPropertyContactViewModule {}
