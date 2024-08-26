import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalenderDashboardRoutingModule } from './calendar-dashboard-routing.module';
import { AutosizeModule } from 'ngx-autosize';
import { TrudiUiModule } from '@trudi-ui';
import { CalendarFilterModule } from './modules/calendar-filter/calendar-filter.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CalendarHeaderComponent } from '@/app/dashboard/modules/calendar-dashboard/components/calendar-header/calendar-header.component';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { CalendarDashboardComponent } from './calendar-dashboard.component';
import { CalendarListViewModule } from './modules/calendar-list-view/calendar-list-view.module';
import { LinkTaskModule } from './modules/link-task/link-task.module';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { CalendarConnectPopupComponent } from './modules/calendar-connect-popup/calendar-connect-popup.component';
import { SharedModule } from '@shared/shared.module';
import { CalendarDatePickerComponent } from './components/calendar-header/calendar-date-picker/calendar-date-picker.component';
import { EventsSidebarComponent } from './modules/events-sidebar/events-sidebar.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CalendarFocusViewComponent } from './modules/calendar-filter/components/calendar-focus-view/calendar-focus-view.component';
import { EventDatetimePickerComponent } from '@/app/dashboard/modules/calendar-dashboard/components/calendar-header/event-datetime-picker/event-datetime-picker.component';

@NgModule({
  declarations: [
    CalendarDashboardComponent,
    CalendarHeaderComponent,
    CalendarConnectPopupComponent,
    CalendarDatePickerComponent,
    EventsSidebarComponent,
    CalendarFocusViewComponent,
    EventDatetimePickerComponent
  ],
  imports: [
    CommonModule,
    AutosizeModule,
    FormsModule,
    ReactiveFormsModule,
    CalenderDashboardRoutingModule,
    CalendarFilterModule,
    TrudiUiModule,
    CalendarListViewModule,
    SharePopUpModule,
    LinkTaskModule,
    NzToolTipModule,
    SharedModule,
    DragDropModule
  ]
})
export class CalendarDashboardModule {}
