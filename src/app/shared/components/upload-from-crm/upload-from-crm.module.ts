import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadFromCrmComponent } from './upload-from-crm.component';
import { AttachFileFromCRMPopupComponent } from './components/attach-file-from-crm-popup/attach-file-from-crm.component';
import { SelectPropertyPopupComponent } from './components/select-property-popup/select-property-popup.component';
import { TrudiUiModule } from '@trudi-ui';
import { UploadFromCRMService } from './upload-from-crm.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { TenantTabGroupModule } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/tenant-tab-group/tenant-tab-group.module';
import { TrudiTabsComponent } from '@shared/components/trudi-tabs/trudi-tab-panels.component';
import { RenderedDirective } from '@shared/directives/rendered.directive';
import { FileRowComponent } from './components/attach-file-from-crm-popup/components/file-row/file-row.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@NgModule({
  imports: [
    CommonModule,
    TrudiUiModule,
    ReactiveFormsModule,
    FormsModule,
    CustomPipesModule,
    TenantTabGroupModule,
    NzSkeletonModule,
    NzToolTipModule,
    ScrollingModule
  ],
  declarations: [
    UploadFromCrmComponent,
    AttachFileFromCRMPopupComponent,
    SelectPropertyPopupComponent,
    TrudiTabsComponent,
    RenderedDirective,
    FileRowComponent
  ],
  providers: [UploadFromCRMService],
  exports: [
    UploadFromCrmComponent,
    AttachFileFromCRMPopupComponent,
    SelectPropertyPopupComponent,
    TrudiTabsComponent,
    RenderedDirective,
    FileRowComponent
  ]
})
export class UploadFromCrmModule {}
