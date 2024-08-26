import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvitationMessageComponent } from './invitation-message.component';
import { SharedModule } from '@shared/shared.module';
import { InviteSuccessComponent } from '@shared/components/invite-success/invite-success.component';

@NgModule({
  declarations: [InvitationMessageComponent, InviteSuccessComponent],
  imports: [CommonModule, SharedModule],
  exports: [InvitationMessageComponent]
})
export class InvitationMessageModule {}
