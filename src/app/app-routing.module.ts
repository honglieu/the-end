import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { LoginComponent as LoginComponentPortal } from './auth/login/login.component';
import { CheckLogin } from './check.login';
import { CallingComponent } from './calling/calling.component';
import { VoiceCallingComponent } from './calling/voice-call/voice-calling.component';
import { DesInternetErrorComponent } from './no-internet/des-internet-error/des-internet-error.component';
import { CrashAppComponent } from './crash-app/crash-app.component';
import { CheckRole } from './check.role';
import { UserType } from './services/constants';
import { NoInternetComponent } from './no-internet/no-internet.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { OutLookCallBackComponent } from './auth/outlook-callback/outlook-callback.component';
import { CustomPreloadingStrategy } from './custom-preload-strategy';
import { DashboardGuard } from './dashboard/common/guards/dashboard.guard';
import { MediaLinkComponent } from '@/app/media-link/media-link.component';

const isPortal = true ||
  window.location.href.includes('portal') ||
  window.location.href.includes('localhost');
// const isPortal = true;
export const routes: Routes = [
  { path: 'server-err-500', component: DesInternetErrorComponent },
  { path: 'no-internet', component: NoInternetComponent },
  {
    path: '',
    component: isPortal ? LoginComponentPortal : LoginComponent,
    children: [],
    canActivate: [CheckLogin]
  },
  {
    path: 'dashboard',
    canActivate: [CheckLogin],
    loadChildren: () =>
      import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
    data: { preload: true }
  },
  {
    path: 'call/:roomId/:userId/:propertyId',
    component: CallingComponent,
    children: [],
    canActivate: [CheckLogin]
  },
  {
    path: 'voice-call/:conversationId/:userId/:propertyId',
    component: VoiceCallingComponent,
    canActivate: [CheckLogin],
    children: []
  },
  {
    path: 'welcome-onboard',
    canActivate: [CheckLogin],
    loadChildren: () =>
      import('./welcome-onboard/welcome-onboard.module').then(
        (m) => m.WelcomeOnboardModule
      )
  },
  {
    path: 'controls',
    canActivate: [CheckLogin, CheckRole],
    data: {
      roles: [UserType.ADMIN, UserType.AGENT, UserType.SUPERVISOR]
    },
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: '/dashboard/console-settings'
      },
      {
        path: 'agent-management',
        pathMatch: 'full',
        redirectTo: '/dashboard/console-settings/agent-management'
      },
      {
        path: 'task-names',
        pathMatch: 'full',
        redirectTo: '/dashboard/console-settings/task-names'
      },
      {
        path: 'task-editor',
        pathMatch: 'full',
        redirectTo: '/dashboard/console-settings/task-editor'
      }
    ]
  },
  {
    path: 'crud-agency',
    canActivate: [CheckLogin],
    loadChildren: () =>
      import('./crud-agency/crud-agency.module').then((m) => m.CrudAgencyModule)
  },
  {
    path: 'user-setting',
    loadChildren: () =>
      import('./profile-setting/profile-setting.module').then(
        (m) => m.ProfileSettingModule
      )
  },

  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule)
  },

  {
    path: 'email-notification-setting',
    loadChildren: () =>
      import('./public-page/public-page.module').then((m) => m.PublicPageModule)
  },

  { path: 'crash-app', component: CrashAppComponent },
  {
    path: 'outlook-callback',
    component: OutLookCallBackComponent
  },
  {
    path: 'media/:shortLink',
    component: MediaLinkComponent,
    children: []
  },
  {
    path: '**',
    pathMatch: 'full',
    component: NotFoundComponent,
    children: [],
    canActivate: [DashboardGuard]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: CustomPreloadingStrategy
    })
  ],
  exports: [RouterModule],
  providers: [CustomPreloadingStrategy]
})
export class AppRoutingModule {}
