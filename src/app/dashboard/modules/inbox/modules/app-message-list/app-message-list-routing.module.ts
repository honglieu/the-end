import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppMessageListComponent } from './app-message-list.component';
import { AppRouteName } from '@shared/enum';
import { PreventButtonGuard } from '@trudi-ui';

const routes: Routes = [
  {
    path: '',
    component: AppMessageListComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all'
      },
      {
        path: ':status',
        component: AppMessageListComponent,
        canActivate: [PreventButtonGuard],
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
export class AppMessageListRoutingModule {}
