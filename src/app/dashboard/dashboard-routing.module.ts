import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { TaskGuard } from './common/guards/task.guard';
import { RedirectToInboxDetailGuard } from './common/guards/redirect-to-inbox-detail.guard';
import { DashboardResolverModule } from './resolvers/dashboard-resolver.module';
import { DashboardResolver } from './resolvers';
import { PreventButtonGuard } from '@trudi-ui';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    resolve: {
      appData: DashboardResolver
    },
    children: [
      {
        path: 'console-settings',
        loadChildren: () =>
          import('../console-setting/console-setting.module').then(
            (m) => m.ConsoleSettingModule
          ),
        canActivate: [PreventButtonGuard]
      },
      {
        path: '',
        children: [
          { path: '', redirectTo: 'inbox', pathMatch: 'full' },
          {
            path: 'agency-settings',
            loadChildren: () =>
              import('./modules/agency-settings/agency-settings.module').then(
                (m) => m.AgencySettingsModule
              ),
            canActivate: [PreventButtonGuard]
          },
          {
            path: 'inbox',
            loadChildren: () => {
              return import('./modules/inbox/inbox.module').then(
                (m) => m.InboxModule
              );
            }
          },
          {
            path: 'tasks',
            loadChildren: () =>
              import('@/app/dashboard/modules/task-page/task-page.module').then(
                (m) => m.TaskPageModule
              )
          },
          {
            path: 'contacts',
            loadChildren: () =>
              import('@/app/user/user.module').then((m) => m.UserModule)
          },
          {
            path: 'profile-settings',
            loadChildren: () =>
              import('../profile-setting/profile-setting.module').then(
                (m) => m.ProfileSettingModule
              ),
            canActivate: [PreventButtonGuard]
          },
          {
            path: 'mailbox-settings',
            loadChildren: () =>
              import('../mailbox-setting/mailbox-setting.module').then(
                (m) => m.MailboxSettingModule
              )
          },
          {
            path: 'event',
            loadChildren: () =>
              import(
                '@/app/dashboard/modules/calendar-dashboard/calendar-dashboard.module'
              ).then((m) => m.CalendarDashboardModule)
          },
          {
            path: 'tasks',
            children: [
              {
                path: ':status',
                canActivate: [TaskGuard],
                children: []
              },
              {
                path: '',
                pathMatch: 'full',
                canActivate: [TaskGuard],
                children: []
              }
            ]
          },
          {
            path: 'detail',
            children: [
              {
                path: ':taskId',
                canActivate: [RedirectToInboxDetailGuard],
                children: []
              },
              {
                path: '',
                pathMatch: 'full',
                canActivate: [RedirectToInboxDetailGuard],
                children: []
              }
            ]
          },
          {
            path: 'calendar-view',
            loadChildren: () =>
              import('@/app/calendar-view/calendar-view.module').then(
                (m) => m.CalendarViewModule
              )
          },
          {
            path: 'task-template/:taskTemplateId',
            loadChildren: () =>
              import(
                '@/app/dashboard/modules/task-editor/modules/task-template-details/task-template-details.module'
              ).then((m) => m.TaskTemplateDetailsModule)
          },
          {
            path: 'insights',
            loadChildren: () =>
              import('@/app/dashboard/modules/insights/insights.module').then(
                (m) => m.InsightsModule
              )
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes), DashboardResolverModule],
  exports: [RouterModule]
})
export class DashboardRoutingModule {}
