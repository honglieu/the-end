import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SharedModule } from '@shared/shared.module';
import { TrudiUiModule } from '@trudi-ui';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { PortalModule } from '@angular/cdk/portal';
import { EmailListViewRoutingModule } from './email-list-view-routing.module';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { EmailViewIndexComponent } from './components/email-view-index/email-view-index.component';
import { EmailViewListComponent } from './components/email-view-list/email-view-list.component';
import { EmailViewRowComponent } from './components/email-view-row/email-view-row.component';
import { EmailListViewComponent } from './email-list-view.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { EmailViewDetailMessageComponent } from './components/email-view-detail-message/email-view-detail-message.component';
import { EmailViewDetailComponent } from './components/email-view-detail/email-view-detail.component';
import { MsgAttachmentLoadModule } from '@shared/components/msg-attachment-load/msg-attachment-load.module';
import { MessageViaEmailModule } from '@shared/components/chat/message-via-email/message-via-email.module';
import { TaskDetailService } from '@/app/task-detail/services/task-detail.service';
import { ConfirmMoveMessageToInboxPopupComponent } from './components/confirm-move-multiple-popup/confirm-move-message-to-inbox-popup.component';
import { TaskDragDropService } from '@/app/dashboard/modules/task-page/services/task-drag-drop.service';
import { RxLet } from '@rx-angular/template/let';
import { RxIf } from '@rx-angular/template/if';
import { RxFor } from '@rx-angular/template/for';

@NgModule({
  declarations: [
    EmailListViewComponent,
    EmailViewIndexComponent,
    EmailViewListComponent,
    EmailViewRowComponent,
    EmailViewDetailComponent,
    EmailViewDetailMessageComponent,
    ConfirmMoveMessageToInboxPopupComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    TrudiUiModule,
    NzToolTipModule,
    ScrollingModule,
    NzSkeletonModule,
    SharePopUpModule,
    PortalModule,
    CustomPipesModule,
    EmailListViewRoutingModule,
    InfiniteScrollModule,
    DragDropModule,
    NzDropDownModule,
    MsgAttachmentLoadModule,
    MessageViaEmailModule,
    RxLet,
    RxIf,
    RxFor
  ],
  exports: [TrudiUiModule, SharedModule],
  providers: [TaskDragDropService, TaskDetailService]
})
export class EmailListViewModule {}
