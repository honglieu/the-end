import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { A11yModule } from '@angular/cdk/a11y';
import { PortalModule } from '@angular/cdk/portal';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { PromotionsModalModule } from '@/app/console-setting/promotions/component/promotions-modal/promotions-modal.module';
import { DesInternetErrorComponent } from '@/app/no-internet/des-internet-error/des-internet-error.component';
import { GoogleAnalyticsService } from '@services/gaTracking.service';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { SharedModule } from '@shared/shared.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TrudiUiModule } from '@trudi-ui';
import { LoadingDashboardComponent } from './components/loading-dashboard/loading-dashboard.component';
import { SidebarItemCreateComponent } from './components/sidebar-item-create/sidebar-item-create.component';
import { SidebarItemSyncComponent } from './components/sidebar-item-sync/sidebar-item-sync.component';
import { SidebarItemComponent } from './components/sidebar-item/sidebar-item.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { NotificationModule } from './modules/notification/notification.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { GlobalSearchComponent } from './components/global-search/global-search.component';
import { SearchResultListComponent } from './components/global-search/components/search-result-list/search-result-list.component';
import { SearchFilterComponent } from './components/global-search/components/search-filter/search-filter.component';
import { FilterAssigneeComponent } from './components/global-search/components/search-filter/components/filter-assignee/filter-assignee.component';
import { FilterPortfolioComponent } from './components/global-search/components/search-filter/components/filter-portfolio/filter-portfolio.component';
import { FilterMessageComponent } from './components/global-search/components/search-filter/components/filter-message/filter-message.component';
import { SearchResultRowComponent } from './components/global-search/components/search-result-row/search-result-row.component';
import { FilterMailboxComponent } from './components/global-search/components/search-filter/components/filter-mailbox/filter-mailbox.component';
import { SearchListSkeletonComponent } from './components/global-search/components/search-result-list/components/search-list-skeleton/search-list-skeleton.component';
import { SearchFilterSkeletonComponent } from './components/global-search/components/search-filter/components/search-filter-skeleton/search-filter-skeleton.component';
import { HeaderDashboardComponent } from './components/header-dashboard/header-dashboard.component';
import { HeaderItemComponent } from './components/header-item/header-item.component';
import { HeaderItemSyncComponent } from './components/header-item-sync/header-item-sync.component';
import { HeaderLeftDashboardComponent } from './components/header-left-dashboard/header-left-dashboard.component';
import { HeaderRightDashboardComponent } from './components/header-right-dashboard/header-right-dashboard.component';
import { CompanySettingsModule } from './modules/company-settings/company-settings.module';
import { OverlayModule } from '@angular/cdk/overlay';
import { MessageFlowModule } from '@/app/dashboard/modules/message-flow/message-flow.module';
import { NzNoAnimationModule } from 'ng-zorro-antd/core/no-animation';
import { PreventButtonModule } from '@trudi-ui';
import { MergeSimilarEnquiriesComponent } from './components/merge-similar-enquiries/merge-similar-enquiries.component';
import { MailboxSettingModule } from '@/app/mailbox-setting/mailbox-setting.module';
import { AutomatedReplyRowComponent } from './components/automated-reply-row/automated-reply-row.component';
import { SearchResultRowConversationStatusPipe } from './components/global-search/components/search-result-row/pipe/search-result-row-conversation-status.pipe';
import { PmRolePipe } from './components/global-search/components/search-result-row/pipe/pm-role.pipe';
import { HeaderFocusViewComponent } from './components/header-focus-view/header-focus-view.component';
@NgModule({
  declarations: [
    SidebarComponent,
    SidebarItemComponent,
    DashboardComponent,
    SidebarItemCreateComponent,
    SidebarItemSyncComponent,
    LoadingDashboardComponent,
    DesInternetErrorComponent,
    HeaderDashboardComponent,
    HeaderItemComponent,
    HeaderItemSyncComponent,
    HeaderLeftDashboardComponent,
    HeaderRightDashboardComponent,
    GlobalSearchComponent,
    SearchResultListComponent,
    SearchResultRowComponent,
    SearchFilterComponent,
    FilterAssigneeComponent,
    FilterPortfolioComponent,
    FilterMessageComponent,
    SearchListSkeletonComponent,
    SearchFilterSkeletonComponent,
    FilterMailboxComponent,
    MergeSimilarEnquiriesComponent,
    AutomatedReplyRowComponent,
    HeaderFocusViewComponent,
    SearchResultRowConversationStatusPipe,
    PmRolePipe
  ],
  imports: [
    PromotionsModalModule,
    CommonModule,
    DashboardRoutingModule,
    TrudiUiModule,
    NzDividerModule,
    NzMenuModule,
    TrudiSendMsgModule,
    SharePopUpModule,
    NotificationModule,
    SharedModule,
    PortalModule,
    NzSkeletonModule,
    A11yModule,
    NzDropDownModule,
    NzNoAnimationModule,
    InboxModule,
    CompanySettingsModule,
    OverlayModule,
    MessageFlowModule,
    PreventButtonModule,
    MailboxSettingModule
  ],
  providers: [GoogleAnalyticsService]
})
export class DashboardModule {}
