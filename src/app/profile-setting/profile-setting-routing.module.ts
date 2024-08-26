import { UserProfileComponent } from './../user-profile/user-profile.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfileSettingComponent } from './profile-setting.component';
import { NotificationComponent } from './notification/notification.component';
import { AppointmentAvailabilityComponent } from './appointment-availability/appointment-availability.component';
import { CheckFormSaveChange } from './check.form-save-change';
import { IntegrationsComponent } from './integrations/integrations.component';
import { PortfoliosComponent } from './portfolios/portfolios.component';
import { AccountSettingsComponent } from '@/app/account-settings/account-settings.component';
import { PreventButtonGuard } from '@trudi-ui';

const routes: Routes = [
  {
    path: '',
    component: ProfileSettingComponent,
    children: [
      {
        path: '',
        redirectTo: 'public-profile',
        pathMatch: 'full'
      },
      {
        path: 'account-settings',
        component: AccountSettingsComponent
      },
      {
        path: 'public-profile',
        component: UserProfileComponent,
        canActivate: [PreventButtonGuard]
      },
      {
        path: 'portfolios',
        component: PortfoliosComponent
      },
      {
        path: 'notification',
        component: NotificationComponent,
        canActivate: [PreventButtonGuard]
      },
      {
        path: 'integrations',
        component: IntegrationsComponent
      },
      {
        path: 'appointment-availability',
        canDeactivate: [CheckFormSaveChange],
        component: AppointmentAvailabilityComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileSettingRoutingModule {}
