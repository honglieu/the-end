import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgenciesViewPageComponent } from './agencies-view-page.component';
import { HeaderFilterAgencyComponent } from '@/app/console-setting/agencies/components/header-filter-agency/header-filter-agency.component';
import { DropdownMenuConsoleComponent } from '@/app/console-setting/agencies/components/dropdown-menu-console/dropdown-menu-console.component';
import { SharedModule } from '@shared/shared.module';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { DashboardSharedModule } from '@/app/dashboard/shared/dashboard-shared.module';
import { TrudiUiModule } from '@trudi-ui';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { SelectTaskTemplatesComponent } from '@/app/console-setting/agencies/new-edit-agency/components/select-task-templates/select-task-templates.component';
import { SelectCrmSubscriptionComponent } from '@/app/console-setting/agencies/new-edit-agency/components/select-crm-subscription/select-crm-subscription.component';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { DisplayRegionsPipe } from '@/app/console-setting/agencies/utils/pipes/display-regions.pipe';
import { NewEditCompanyComponent } from '@/app/console-setting/agencies/new-edit-agency/new-edit-company.component';
import { SelectCompanyPlanComponent } from '@/app/console-setting/agencies/new-edit-agency/components/select-company-plan/select-company-plan.component';

@NgModule({
  declarations: [
    AgenciesViewPageComponent,
    HeaderFilterAgencyComponent,
    DropdownMenuConsoleComponent,
    NewEditCompanyComponent,
    SelectCompanyPlanComponent,
    SelectTaskTemplatesComponent,
    SelectCrmSubscriptionComponent,
    DisplayRegionsPipe
  ],
  imports: [
    CommonModule,
    SharedModule,
    DashboardSharedModule,
    InfiniteScrollModule,
    NzSkeletonModule,
    ReactiveFormsModule,
    FormsModule,
    NzDropDownModule,
    NzToolTipModule,
    NgOptionHighlightModule,
    NgxMaskDirective,
    NgxMaskPipe,
    TrudiUiModule
  ],
  providers: [provideNgxMask()]
})
export class AgenciesViewPageModule {}
