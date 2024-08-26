import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeOnboardComponent } from './welcome-onboard.component';
import { WelcomeOnboardRoutingModule } from './welcome-onboard-routing.module';
import { UserAvatarModule } from '@shared/components/user-avatar/user-avatar.module';

@NgModule({
  declarations: [WelcomeOnboardComponent],
  imports: [CommonModule, WelcomeOnboardRoutingModule, UserAvatarModule]
})
export class WelcomeOnboardModule {}
