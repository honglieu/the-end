import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ConfirmCallingRequestComponent } from './confirm-calling-request/confirm-calling-request.component';
import { AddDocumentComponent } from './add-document/add-document.component';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { BoxTrudiComponent } from './box-trudi/box-trudi.component';
import { ForwardRequestComponent } from './share/forward-request/forward-request.component';
import { NotificationPopupComponent } from './notification-popup/notification-popup.component';
import { AutosizeModule } from 'ngx-autosize';
import { DropdownGroupComponent } from './move-mess-to-different-task/dropdown-group/dropdown-group.component';
import { GroupItemComponent } from './move-mess-to-different-task/dropdown-group/group-item/group-item.component';
import { MoveMessToDifferentComponent } from './move-mess-to-different-task/move-mess-to-different-task.component';
import { ForwardViaEmailComponent } from './forward-via-email/forward-via-email.component';
import { BoxTrudiSuggestionComponent } from './box-trudi-suggestion/box-trudi-suggestion.component';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TrudiScheduledMsgModule } from '@/app/trudi-scheduled-msg/trudi-scheduled-msg.module';
import { UserTypeInPTPipe } from '@shared/pipes/user-type-in-pt.pipe';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [
    ConfirmCallingRequestComponent,
    AddDocumentComponent,
    BoxTrudiComponent,
    ForwardRequestComponent,
    NotificationPopupComponent,
    MoveMessToDifferentComponent,
    DropdownGroupComponent,
    GroupItemComponent,
    ForwardViaEmailComponent,
    BoxTrudiSuggestionComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    DragDropModule,
    InfiniteScrollModule,
    AutosizeModule,
    SharePopUpModule,
    ScrollingModule,
    TrudiSendMsgModule,
    NzToolTipModule,
    TrudiUiModule,
    TrudiScheduledMsgModule
  ],
  providers: [PhoneNumberFormatPipe, UserTypeInPTPipe],
  exports: [MoveMessToDifferentComponent, BoxTrudiSuggestionComponent]
})
export class TaskModule {}
