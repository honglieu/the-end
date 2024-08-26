import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { SharedModule } from '@shared/shared.module';
import { TrudiUiModule } from '@trudi-ui';
import { TenantApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/api/tenant-api.service';
import { TenantTabGroupModule } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/tenant-tab-group/tenant-tab-group.module';
import {
  ChargesFormComponent,
  FormatAmountPipe
} from './charges-form/charges-form.component';
import { OneTimeChargesRMTableComponent } from './charges-form/components/one-time-charges-rm-table/one-time-charges-rm-table.component';
import { RecurringChargesRMTableComponent } from './charges-form/components/recurring-charges-rm-table/recurring-charges-rm-table.component';
import {
  ContactFormComponent,
  ShowTextTooltipContactFormPipe
} from './contact-form/contact-form.component';
import { DepositFormComponent } from './deposit-form/deposit-form.component';
import { AddressesTabComponent } from './info-form/components/addresses-tab/addresses-tab.component';
import {
  FormatLabelAddressPipe,
  InfoFormComponent
} from './info-form/info-form.component';
import { LeaseFormComponent } from './lease-form/lease-form.component';
import { SettingFormComponent } from './setting-form/setting-form.component';
import { UserFieldsFormComponent } from './user-fields-form/user-fields-form.component';
import { provideNgxMask, NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';

@NgModule({
  declarations: [
    InfoFormComponent,
    LeaseFormComponent,
    ContactFormComponent,
    DepositFormComponent,
    SettingFormComponent,
    ChargesFormComponent,
    UserFieldsFormComponent,
    ShowTextTooltipContactFormPipe,
    AddressesTabComponent,
    FormatLabelAddressPipe,
    OneTimeChargesRMTableComponent,
    RecurringChargesRMTableComponent,
    FormatAmountPipe
  ],
  providers: [TenantApiService, provideNgxMask()],
  imports: [
    SharedModule,
    CommonModule,
    TrudiUiModule,
    ReactiveFormsModule,
    TenantTabGroupModule,
    NzSkeletonModule,
    NzDropDownModule,
    TrudiDatePickerModule,
    FormsModule,
    NgSelectModule,
    NzToolTipModule,
    NgxMaskDirective,
    NgxMaskPipe
  ],
  exports: [
    InfoFormComponent,
    LeaseFormComponent,
    ContactFormComponent,
    DepositFormComponent,
    SettingFormComponent,
    ChargesFormComponent,
    UserFieldsFormComponent,
    AddressesTabComponent
  ]
})
export class TenantFormModule {}
