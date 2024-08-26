import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TrudiUiModule } from '@trudi-ui';
import {
  TenantTabGroupComponent,
  TenantTabPanelDirective
} from './tenant-tab-group.component';

@NgModule({
  declarations: [TenantTabGroupComponent, TenantTabPanelDirective],
  imports: [CommonModule, TrudiUiModule],
  exports: [TenantTabGroupComponent, TenantTabPanelDirective]
})
export class TenantTabGroupModule {}
