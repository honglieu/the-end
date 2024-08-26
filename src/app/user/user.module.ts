import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DashboardSharedModule } from '@/app/dashboard/shared/dashboard-shared.module';
import { UserRoutingModule } from './user-routing.module';
import { UserComponent } from './user.component';
import { FormsModule } from '@angular/forms';
import { ShareModuleUserModule } from './shared/share-module-user.module';
import { SharedModule } from '@shared/shared.module';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { UserSharedModule } from './shared/user-shared.module';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [UserComponent],
  imports: [
    FormsModule,
    CommonModule,
    UserRoutingModule,
    DashboardSharedModule,
    ShareModuleUserModule,
    SharedModule,
    NzDropDownModule,
    UserSharedModule,
    TrudiUiModule
  ]
})
export class UserModule {}
