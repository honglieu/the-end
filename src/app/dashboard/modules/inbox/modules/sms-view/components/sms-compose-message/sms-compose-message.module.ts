import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SharedModule } from '@/app/shared/shared.module';
import { TrudiModule } from '@/app/task-detail/modules/trudi/trudi.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TrudiScheduledMsgModule } from '@/app/trudi-scheduled-msg/trudi-scheduled-msg.module';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { ReactiveFormsModule } from '@angular/forms';
import { LandlordToOwnerPipe } from '@/app/shared/pipes/landlord-to-owner.pipe';
import { MessageLoadingService } from '@/app/task-detail/services/message-loading.service';
import { AppChatService } from '@/app/task-detail/modules/app-chat/app-chat.service';
import { TinyEditorModule } from '@/app/shared/components/tiny-editor/tiny-editor.module';
import { SmsComposeMessageComponent } from './sms-compose-message.component';
import { SmsInlineMessageEditorComponent } from './components/sms-inline-message-editor/sms-inline-message-editor.component';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [SmsComposeMessageComponent, SmsInlineMessageEditorComponent],
  imports: [
    CommonModule,
    InfiniteScrollModule,
    DragDropModule,
    SharedModule,
    TrudiModule,
    TrudiSendMsgModule,
    TrudiScheduledMsgModule,
    NzSkeletonModule,
    NzToolTipModule,
    NzDropDownModule,
    ShareModuleUserModule,
    NzResizableModule,
    ReactiveFormsModule,
    TinyEditorModule,
    TrudiUiModule
  ],
  exports: [SmsComposeMessageComponent],
  providers: [LandlordToOwnerPipe, MessageLoadingService, AppChatService]
})
export class SmsComposeMessageModule {}
