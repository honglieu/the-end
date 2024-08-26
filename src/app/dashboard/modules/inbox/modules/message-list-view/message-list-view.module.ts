import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortalModule } from '@angular/cdk/portal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SharedModule } from '@shared/shared.module';
import { TrudiUiModule } from '@trudi-ui';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { ForwardViaEmailModule } from '@/app/task-detail/components/forward-via-email/forward-via-email.module';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { ForwardConversationModule } from '@/app/task-detail/components/forward-conversation/forward-conversation.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MessageListViewRoutingModule } from './message-list-view-routing.module';
import { TaskDetailModule } from '@/app/task-detail/task-detail.module';
import { MessageListViewComponent } from './message-list-view.component';
import { MessageViewIndexComponent } from './components/message-view-index/message-view-index.component';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { TrudiConfirmService } from '@trudi-ui';
import { MessageViewListComponent } from './components/message-view-list/message-view-list.component';
import { MessageViewRowComponent } from './components/message-view-row/message-view-row.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { SharedModule as InboxSharedModule } from '@/app/dashboard/modules/inbox/shared/shared.module';
import { MessageApiService } from './services/message-api.service';
import { InboxModule } from '@/app/dashboard/modules/inbox/inbox.module';
import { RxFor } from '@rx-angular/template/for';
import { RxIf } from '@rx-angular/template/if';
import { RxLet } from '@rx-angular/template/let';
import { TaskDragDropService } from '@/app/dashboard/modules/task-page/services/task-drag-drop.service';

@NgModule({
  declarations: [
    MessageListViewComponent,
    MessageViewIndexComponent,
    MessageViewListComponent,
    MessageViewRowComponent
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
    ForwardViaEmailModule,
    MoveMessToDifferentTaskModule,
    CustomPipesModule,
    ForwardConversationModule,
    DragDropModule,
    CustomPipesModule,
    InfiniteScrollModule,
    MessageListViewRoutingModule,
    TaskDetailModule,
    NzMenuModule,
    NzDropDownModule,
    InboxSharedModule,
    InboxModule,
    RxFor,
    RxLet,
    RxIf
  ],
  exports: [TrudiUiModule, SharedModule],
  providers: [TaskDragDropService, TrudiConfirmService, MessageApiService]
})
export class MessageListViewModule {}
