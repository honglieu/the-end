import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { InternalNoteComponent } from './internal-note.component';
import { MainNoteComponent } from './modules/main-note/main-note.component';
import { MessageNoteComponent } from './components/message-note/message-note.component';
import { UserAvatarModule } from '@shared/components/user-avatar/user-avatar.module';
import { AppChatModule } from '@/app/task-detail/modules/app-chat/app-chat.module';
import { ChatNoteComponent } from './modules/chat-note/chat-note.component';
import { EditorModule } from '@tinymce/tinymce-angular';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { TrudiUiModule } from '@trudi-ui';
import { DocumentNoteComponent } from './components/document-note/document-note.component';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { InternalNoteAttachmentComponent } from './modules/chat-note/internal-note-attachment/internal-note-attachment.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MessageViaEmailModule } from '@shared/components/chat/message-via-email/message-via-email.module';
import { PreventButtonModule } from '@trudi-ui';
import { InternalNoteRoutingModule } from './internal-note-routing.module';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [
    InternalNoteComponent,
    MainNoteComponent,
    MessageNoteComponent,
    ChatNoteComponent,
    DocumentNoteComponent,
    InternalNoteAttachmentComponent
  ],
  imports: [
    CommonModule,
    DragDropModule,
    SharedModule,
    UserAvatarModule,
    AppChatModule,
    EditorModule,
    InfiniteScrollModule,
    NzSkeletonModule,
    NzDropDownModule,
    TrudiUiModule,
    TrudiSendMsgModule,
    MessageViaEmailModule,
    PreventButtonModule,
    InternalNoteRoutingModule,
    RxPush
  ],
  exports: [InternalNoteComponent],
  providers: []
})
export class InternalNoteModule {}
