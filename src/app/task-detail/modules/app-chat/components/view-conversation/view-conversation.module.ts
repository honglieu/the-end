import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewConversationComponent } from './view-conversation.component';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [ViewConversationComponent],
  imports: [CommonModule, SharedModule],
  exports: [ViewConversationComponent]
})
export class ViewConversationModule {}
