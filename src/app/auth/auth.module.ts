import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { SharedModule } from '@shared/shared.module';
import { AuthRoutingModule } from './auth-routing.module';
import { AuthComponent } from './auth.component';
import { ForgotPassowrdSuccessComponent } from './forgot-password-success/forget-password-success.component';
import { ForgotComponent } from './forgot-password/forget-password.component';
import { LoginComponent } from './login/login.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { TrudiUiModule } from '@trudi-ui';
import { OutLookCallBackComponent } from './outlook-callback/outlook-callback.component';

@NgModule({
  declarations: [
    AuthComponent,
    LoginComponent,
    ForgotComponent,
    ForgotPassowrdSuccessComponent,
    ResetPasswordComponent,
    OutLookCallBackComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    AuthRoutingModule,
    NgxMaskDirective,
    NgxMaskPipe,
    TrudiUiModule
  ],
  providers: [provideNgxMask()]
})
export class AuthModule {}
