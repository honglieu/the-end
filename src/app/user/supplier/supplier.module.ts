import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupplierRoutingModule } from './supplier-routing.module';
import { SupplierComponent } from './supplier.component';
import { SharedModule } from '@shared/shared.module';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { SupplierContactSearchComponent } from './components/supplier-contact-search/supplier-contact-search.component';
import { UserSharedModule } from '@/app/user/shared/user-shared.module';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [SupplierComponent, SupplierContactSearchComponent],
  imports: [
    CommonModule,
    SharedModule,
    SharePopUpModule,
    SupplierRoutingModule,
    NzSkeletonModule,
    UserSharedModule,
    ShareModuleUserModule,
    TrudiUiModule
  ]
})
export class SupplierModule {}
