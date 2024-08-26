import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventNameComponent } from '@/app/dashboard/modules/calendar-dashboard/calendar-dashboard-share/event-name/event-name.component';
import { TrudiUiModule } from '@trudi-ui';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [EventNameComponent],
  imports: [CommonModule, TrudiUiModule, FormsModule, SharedModule],
  exports: [EventNameComponent]
})
export class CalendarDashboardShareModule {}
