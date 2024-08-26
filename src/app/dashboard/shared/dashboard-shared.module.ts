import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderWrapperComponent } from './components/header-wrapper/header-wrapper.component';
import { SidebarWrapperComponent } from './components/sidebar-wrapper/sidebar-wrapper.component';

@NgModule({
  declarations: [HeaderWrapperComponent, SidebarWrapperComponent],
  imports: [CommonModule],
  exports: [HeaderWrapperComponent, SidebarWrapperComponent]
})
export class DashboardSharedModule {}
