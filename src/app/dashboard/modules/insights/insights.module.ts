import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccomplishmentsComponent } from './components/accomplishments/accomplishments.component';
import { TopPerformingTeamMembersComponent } from './components/top-performing-team-members/top-performing-team-members.component';
import { InsightsComponent } from '@/app/dashboard/modules/insights/insights.component';
import { InsightsRoutingModule } from '@/app/dashboard/modules/insights/insights-routing.module';
import { InsightsHeaderComponent } from './components/insights-header/insights-header.component';
import { InsightsUpsellModalComponent } from './components/insights-upsell-modal/insights-upsell-modal.component';
import { NZ_DATE_CONFIG } from 'ng-zorro-antd/i18n';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { TimeSavingsSectionComponent } from './components/time-savings-section/time-savings-section.component';
import { EfficiencySectionComponent } from './components/efficiency-section/efficiency-section.component';
import { TaskCompletedSectionComponent } from './components/task-completed-section/task-completed-section.component';
import { EnquiresResolvedSectionComponent } from './components/enquires-resolved-section/enquires-resolved-section.component';
import { TrudiUiModule } from '@trudi-ui';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AccomplishmentsBoxDataComponent } from './components/accomplishments/accomplishments-box-data/accomplishments-box-data.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { InsightsExportComponent } from './components/insights-header/insights-export/insights-export.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { InsightsSkeletonComponent } from './components/insights-skeleton/insights-skeleton.component';
import { FormsModule } from '@angular/forms';
import { UpSellComponent } from './components/up-sell/up-sell.component';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { InsightsGuard } from '@/app/dashboard/modules/insights/guards/insights.guard';
import { UpSellGuard } from '@/app/dashboard/modules/insights/guards/up-sell.guard';
import { InsightsSettingComponent } from './components/insights-header/insights-setting/insights-setting.component';
import { SettingOptionItemComponent } from './components/insights-header/insights-setting/setting-option-item/setting-option-item.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { ShouldShowChartPipe } from './pipes/should-show-chart.pipe';
import { ShouldShowStackBarChart } from './pipes/should-show-stack-bar-chart.pipe';
import { CustomDirectivesModule } from '@/app/shared';

@NgModule({
  declarations: [
    InsightsComponent,
    InsightsHeaderComponent,
    AccomplishmentsComponent,
    TopPerformingTeamMembersComponent,
    InsightsUpsellModalComponent,
    InsightsExportComponent,
    TimeSavingsSectionComponent,
    EfficiencySectionComponent,
    TaskCompletedSectionComponent,
    EnquiresResolvedSectionComponent,
    InsightsUpsellModalComponent,
    AccomplishmentsBoxDataComponent,
    InsightsSkeletonComponent,
    UpSellComponent,
    InsightsSettingComponent,
    SettingOptionItemComponent,
    ShouldShowStackBarChart,
    ShouldShowChartPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    InsightsRoutingModule,
    TrudiUiModule,
    NzToolTipModule,
    ScrollingModule,
    NzDatePickerModule,
    NzDropDownModule,
    NzSkeletonModule,
    SharePopUpModule,
    ReactiveFormsModule,
    NzMenuModule,
    OverlayModule,
    CustomDirectivesModule
  ],
  providers: [
    {
      provide: NZ_DATE_CONFIG,
      useValue: {
        firstDayOfWeek: 1
      }
    },
    InsightsGuard,
    UpSellGuard
  ]
})
export class InsightsModule {}
