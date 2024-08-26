import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { SharedModule } from '@shared/shared.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TrudiUiModule } from '@trudi-ui';
import { TrudiButtonScheduledMsgComponent } from './components/trudi-button-scheduled-msg/trudi-button-scheduled-msg.component';
import { TrudiDeleteScheduledMsgComponent } from './components/trudi-delete-scheduled-msg/trudi-delete-scheduled-msg.component';
import { TrudiScheduledMsgBodyComponent } from './components/trudi-scheduled-msg-body/trudi-scheduled-msg-body.component';
import { TrudiSendNowConfirmComponent } from './components/trudi-send-now-confirm/trudi-send-now-confirm.component';
import { TrudiScheduledMsgService } from './services/trudi-scheduled-msg.service';
import { TrudiScheduledMsgComponent } from './trudi-scheduled-msg.component';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@NgModule({
  declarations: [
    TrudiScheduledMsgComponent,
    TrudiButtonScheduledMsgComponent,
    TrudiScheduledMsgBodyComponent,
    TrudiSendNowConfirmComponent,
    TrudiDeleteScheduledMsgComponent
  ],
  imports: [
    CommonModule,
    SharePopUpModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    TrudiUiModule,
    NgOptionHighlightModule,
    TrudiSendMsgModule,
    NzToolTipModule
  ],
  exports: [
    TrudiScheduledMsgComponent,
    TrudiButtonScheduledMsgComponent,
    TrudiScheduledMsgBodyComponent,
    TrudiSendNowConfirmComponent,
    TrudiDeleteScheduledMsgComponent
  ],
  providers: [TrudiScheduledMsgService]
})
export class TrudiScheduledMsgModule {}
