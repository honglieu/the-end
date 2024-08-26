import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DashboardSharedModule } from '@/app/dashboard/shared/dashboard-shared.module';
import { TrudiUiModule } from '@trudi-ui';
import { SharedModule } from '@shared/shared.module';
import { HeaderModule } from '@/app/header/header.module';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TrudiDatePickerModule } from '@trudi-ui';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';
import { EditorModule } from '@tinymce/tinymce-angular';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ImageCropperModule } from 'ngx-image-cropper';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { CompanySettingItemComponent } from './components/company-settings-item/company-settings-item.component';
import { CompanySettingsComponent } from './company-settings.component';
import { AgencySettingsRoutingModule } from '@/app/dashboard/modules/agency-settings/agency-settings-routing.module';

@NgModule({
  declarations: [CompanySettingsComponent, CompanySettingItemComponent],
  imports: [
    CommonModule,
    SharedModule,
    TrudiDatePickerModule,
    SharePopUpModule,
    EditorModule,
    FormsModule,
    DashboardSharedModule,
    TrudiUiModule,
    ImageCropperModule,
    HeaderModule,
    NzSkeletonModule,
    TrudiSendMsgModule,
    DragDropModule,
    ScrollingModule,
    NzToolTipModule,
    NzCollapseModule,
    CustomPipesModule,
    AgencySettingsRoutingModule,
    NgxMaskDirective,
    NgxMaskPipe
  ],
  exports: [CompanySettingsComponent, CompanySettingItemComponent],
  providers: [provideNgxMask()]
})
export class CompanySettingsModule {}
