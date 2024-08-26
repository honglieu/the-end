import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppRouteName } from '@shared/enum';
import { PreventButtonGuard } from '@trudi-ui';
import { facebookViewGuard } from './facebook-view.guard';
import { FacebookViewHubComponent } from './views/facebook-view-hub/facebook-hub.component';

const routes: Routes = [
  {
    path: ':status',
    component: FacebookViewHubComponent,
    canActivate: [facebookViewGuard, PreventButtonGuard],
    data: {
      name: AppRouteName.MESSENGER,
      reuse: true
    }
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'all'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FaceBookViewRoutingModule {}
