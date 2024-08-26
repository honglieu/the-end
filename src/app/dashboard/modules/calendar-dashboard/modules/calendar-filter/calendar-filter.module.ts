import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrudiUiModule } from '@trudi-ui';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { SharedModule } from '@shared/shared.module';
import { CalendarFilterGroupComponent } from './components/calendar-filter-group/calendar-filter-group.component';
import { NzPopoverModule } from 'ng-zorro-antd/popover';

@NgModule({
  declarations: [CalendarFilterGroupComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TrudiUiModule,
    NzDropDownModule,
    NzSelectModule,
    SharedModule,
    NzPopoverModule
  ],
  exports: [CalendarFilterGroupComponent]
})
export class CalendarFilterModule {}
