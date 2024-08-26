import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { DropdownMenuContactsComponent } from './components/dropdown-menu-contacts/dropdown-menu-contacts.component';
import { SharedModule } from '@shared/shared.module';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [DropdownMenuContactsComponent],
  imports: [CommonModule, NzDropDownModule, SharedModule, TrudiUiModule],
  exports: [DropdownMenuContactsComponent]
})
export class UserSharedModule {}
