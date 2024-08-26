import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTableModule } from 'ng-zorro-antd/table';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { DashboardSharedModule } from '@/app/dashboard/shared/dashboard-shared.module';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { SharedModule } from '@shared/shared.module';
import { TrudiUiModule } from '@trudi-ui';
import { AgenciesViewPageModule } from './agencies/agencies-view-page/agencies-view-page.module';
import { AgentComponent } from './agent/agent.component';
import { ConfirmDeleteTaskNameComponent } from './confirm-delete-taskname/confirm-delete-taskname.component';
import { ConsoleSettingRoutingModule } from './console-setting-routing.module';
import { ConsoleSettingComponent } from './console-setting.component';
import { ConfirmDeleteActionLinkComponent } from './global-action-link/confirm-delete-action-link/confirm-delete-action-link.component';
import { GlobalActionLinkComponent } from './global-action-link/global-action-link.component';
import { CarouselInfoComponent } from './promotions/component/carousel-info/carousel-info.component';
import { ListViewPromotionsComponent } from './promotions/component/list-view-promotions/list-view-promotions.component';
import { PromotionsInfoComponent } from './promotions/component/promotions-info/promotions-info.component';
import { PromotionsComponent } from './promotions/promotions-view.component';
import { SettingTaskNameComponent } from './setting-task-name/setting-task-name.component';
import { PromotionsModalModule } from './promotions/component/promotions-modal/promotions-modal.module';
import { CarouselImagePreviewPopupComponent } from './promotions/component/carousel-image-preview-popup/carousel-image-preview-popup.component';

@NgModule({
  declarations: [
    ConsoleSettingComponent,
    AgentComponent,
    GlobalActionLinkComponent,
    SettingTaskNameComponent,
    ConfirmDeleteTaskNameComponent,
    ConfirmDeleteActionLinkComponent,
    PromotionsComponent,
    PromotionsInfoComponent,
    CarouselInfoComponent,
    ListViewPromotionsComponent,
    CarouselImagePreviewPopupComponent
  ],
  imports: [
    PromotionsModalModule,
    CommonModule,
    SharedModule,
    RouterModule,
    ConsoleSettingRoutingModule,
    DashboardSharedModule,
    InfiniteScrollModule,
    NzSkeletonModule,
    ReactiveFormsModule,
    FormsModule,
    NzDropDownModule,
    NzTableModule,
    AgenciesViewPageModule,
    TrudiDatePickerModule,
    NgxMaskDirective,
    NgxMaskPipe,
    TrudiUiModule
  ],
  providers: [provideNgxMask()]
})
export class ConsoleSettingModule {}
