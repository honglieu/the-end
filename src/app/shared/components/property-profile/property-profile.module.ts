import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { SharedModule } from '@shared/shared.module';
import { PropertyProfileDrawerComponent } from './property-profile-drawer/property-profile-drawer.component';
import { PropertyProfileComponent } from './property-profile.component';
import { TenancyDetailComponent } from './components/tenancy-detail/tenancy-detail.component';
import { EventsTabComponent } from './components/events-tab/events-tab.component';
import { FilterEventsComponent } from './components/events-tab/components/filter-events/filter-events.component';
import { EventItemComponent } from './components/events-tab/components/event-item/event-item.component';
import { NotesTabComponent } from './components/notes-tab/notes-tab.component';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { UserPropertyDetailsComponent } from '@shared/components/property-profile/components/user-property-details/user-property-details.component';
import { UserPropertyDetailsBodyComponent } from '@shared/components/property-profile/components/user-property-details/components/user-property-details-body/user-property-details-body.component';
import { UserPropertyDetailsFooterComponent } from '@shared/components/property-profile/components/user-property-details/components/user-property-details-footer/user-property-details-footer.component';
import { UserPropertyDetailsHeaderComponent } from '@shared/components/property-profile/components/user-property-details/components/user-property-details-header/user-property-details-header.component';
import { DetailsTabComponent } from './components/details-tab/details-tab.component';
import { PropertyDetailComponent } from './components/property-detail/property-detail.component';
import { ListTenancyComponent } from './components/property-detail/components/list-tenancy/list-tenancy.component';
import { ListOwnershipsComponent } from './components/property-detail/components/list-ownership/list-ownership.component';
import { InformationComponent } from './components/property-detail/components/information/information.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { DetailEventComponent } from './components/events-tab/components/detail-event/detail-event.component';
import { AddEditNotePopupComponent } from './components/notes-tab/components/add-edit-note-popup/add-edit-note-popup.component';
import { HistoricalEventComponent } from './components/events-tab/components/detail-event/historical-event/historical-event.component';
import { LinkTaskModule } from '@/app/dashboard/modules/calendar-dashboard/modules/link-task/link-task.module';
import { TenancySinceDetailComponent } from '@shared/components/property-profile/components/tenancy-detail/components/tenancy-since-detail/tenancy-since-detail.component';
import { RentedTimePipe } from '@shared/components/property-profile/pipes/rented-time.pipe';
import { FormatDisplayValuePipe } from '@shared/components/property-profile/pipes/format-display-value.pipe';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { ListTenantsComponent } from './components/tenancy-detail/components/list-tenants/list-tenants.component';
import { PreventButtonModule, TrudiUiModule } from '@trudi-ui';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { TenantDetailSkeletonComponent } from './components/skeletons/tenant-detail-skeleton/tenant-detail-skeleton.component';
import { TenancyDetailSkeletonComponent } from './components/skeletons/tenancy-detail-skeleton/tenancy-detail-skeleton.component';
import { TenanciesSectionSkeletonComponent } from './components/skeletons/tenancies-section-skeleton/tenancies-section-skeleton.component';
import { OwnershipSectionSkeletonComponent } from './components/skeletons/ownership-section-skeleton/ownership-section-skeleton.component';
import { InformationSkeletonComponent } from './components/skeletons/information-skeleton/information-skeleton.component';
import { NzTrimPipe } from 'ng-zorro-antd/pipes';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    NzTabsModule,
    NzSkeletonModule,
    NzDropDownModule,
    NzGridModule,
    LinkTaskModule,
    PreventButtonModule,
    InfiniteScrollModule,
    NzTrimPipe,
    TrudiUiModule
  ],
  providers: [],
  declarations: [
    DetailsTabComponent,
    PropertyProfileDrawerComponent,
    PropertyProfileComponent,
    TenancyDetailComponent,
    TenancySinceDetailComponent,
    EventsTabComponent,
    FilterEventsComponent,
    EventItemComponent,
    NotesTabComponent,
    UserPropertyDetailsComponent,
    UserPropertyDetailsHeaderComponent,
    UserPropertyDetailsBodyComponent,
    UserPropertyDetailsFooterComponent,
    PropertyDetailComponent,
    ListTenancyComponent,
    ListOwnershipsComponent,
    InformationComponent,
    DetailEventComponent,
    AddEditNotePopupComponent,
    HistoricalEventComponent,
    RentedTimePipe,
    FormatDisplayValuePipe,
    ListTenantsComponent,
    InformationSkeletonComponent,
    OwnershipSectionSkeletonComponent,
    TenanciesSectionSkeletonComponent,
    TenancyDetailSkeletonComponent,
    TenantDetailSkeletonComponent
  ],
  exports: [
    PropertyProfileDrawerComponent,
    // DetailsTabComponent,
    PropertyProfileComponent,
    TenancyDetailComponent
  ]
})
export class PropertyProfileModule {}
