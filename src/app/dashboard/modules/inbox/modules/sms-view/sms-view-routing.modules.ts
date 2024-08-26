import { SmsViewComponent } from '@/app/dashboard/modules/inbox/modules/sms-view/sms-view.component';
import { SmsViewGuard } from '@/app/dashboard/modules/inbox/modules/sms-view/sms-view.guard';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppRouteName } from '@shared/enum';

const routes: Routes = [
  {
    path: '',
    component: SmsViewComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all'
      },
      {
        path: 'all',
        component: SmsViewComponent,
        canActivate: [SmsViewGuard],
        data: {
          name: AppRouteName.APP_MESSAGES,
          reuse: true
        }
      },
      {
        path: 'resolved',
        component: SmsViewComponent,
        canActivate: [SmsViewGuard],
        data: {
          name: AppRouteName.APP_MESSAGES,
          reuse: true
        }
      },
      {
        path: ':status',
        component: SmsViewComponent,
        data: {
          name: AppRouteName.APP_MESSAGES,
          reuse: true
        }
      }
    ]
  }
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SmsViewRoutingModule {}
