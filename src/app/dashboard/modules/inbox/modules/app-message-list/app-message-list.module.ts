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
import { TaskDetailModule } from '@/app/task-detail/task-detail.module';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { TrudiConfirmService } from '@trudi-ui';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { SharedModule as InboxSharedModule } from '@/app/dashboard/modules/inbox/shared/shared.module';
import { InboxModule } from '@/app/dashboard/modules/inbox/inbox.module';
import { AppMessageListRoutingModule } from './app-message-list-routing.module';
import { AppMessageListComponent } from './app-message-list.component';
import { AppMessageViewIndexComponent } from './components/app-message-view-index/app-message-view-index.component';
import { AppMessageViewItemComponent } from './components/app-message-item/app-message-item.component';
import { AppMessageViewListComponent } from './components/app-message-view-list/app-message-view-list.component';
import { MessageDetailPipe } from './pipes/message-detail.pipe';
import { AppMessageDetailModule } from './components/app-message-detail/app-message-detail.module';
import { AppMessageApiService } from './services/app-message-api.service';
import { AppComposeMessageModule } from './components/app-compose-message/app-compose-message.module';
import { AppMessageDetailListModule } from './components/app-message-detail-list/app-message-detail-list.module';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { MessageDetailSkeletonComponent } from './components/message-detail-skeleton/message-detail-skeleton.component';
import { TaskDragDropService } from '@/app/dashboard/modules/task-page/services/task-drag-drop.service';
import { RxFor } from '@rx-angular/template/for';

@NgModule({
  declarations: [
    AppMessageListComponent,
    AppMessageViewIndexComponent,
    AppMessageViewListComponent,
    AppMessageViewItemComponent,
    MessageDetailPipe,
    MessageDetailSkeletonComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
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
    InfiniteScrollModule,
    AppMessageListRoutingModule,
    TaskDetailModule,
    NzMenuModule,
    NzDropDownModule,
    InboxSharedModule,
    InboxModule,
    AppMessageDetailModule,
    AppComposeMessageModule,
    AppMessageDetailListModule,
    NzTabsModule,
    RxFor,
    TrudiUiModule
  ],

  exports: [SharedModule, MessageDetailPipe],
  providers: [TaskDragDropService, TrudiConfirmService, AppMessageApiService]
})
export class AppMessageListViewModule {}
