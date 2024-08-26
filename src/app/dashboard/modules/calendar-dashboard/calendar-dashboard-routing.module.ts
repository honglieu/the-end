import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CalendarListViewComponent } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-list-view/calendar-list-view.component';
import { CalendarDashboardComponent } from './calendar-dashboard.component';
import { AppRouteName } from '@shared/enum';
import { PreventButtonGuard } from '@trudi-ui';

const routes: Routes = [
  {
    path: '',
    component: CalendarDashboardComponent,
    children: [
      {
        path: '',
        redirectTo: 'events',
        pathMatch: 'full'
      },
      {
        path: 'events',
        component: CalendarListViewComponent,
        data: {
          name: AppRouteName.CALENDAR_PAGE,
          reuse: true
        },
        canActivate: [PreventButtonGuard]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CalenderDashboardRoutingModule {}
