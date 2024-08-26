import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthComponent } from './auth.component';
import { ForgotPassowrdSuccessComponent } from './forgot-password-success/forget-password-success.component';
import { ForgotComponent } from './forgot-password/forget-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      {
        path: 'forgot-password',
        component: ForgotComponent
      },
      {
        path: 'forgot-password-success',
        component: ForgotPassowrdSuccessComponent
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule {}
