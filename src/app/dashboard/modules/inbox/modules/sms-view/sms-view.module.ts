import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SmsViewComponent } from '@/app/dashboard/modules/inbox/modules/sms-view/sms-view.component';
import { SmsViewRoutingModule } from '@/app/dashboard/modules/inbox/modules/sms-view/sms-view-routing.modules';
import { SharedModule } from '@/app/shared/shared.module';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { TrudiUiModule } from '@trudi-ui';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { PortalModule } from '@angular/cdk/portal';
import { ForwardViaEmailModule } from '@/app/task-detail/components/forward-via-email/forward-via-email.module';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { CustomPipesModule } from '@/app/shared/pipes/customPipes.module';
import { ForwardConversationModule } from '@/app/task-detail/components/forward-conversation/forward-conversation.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { TaskDetailModule } from '@/app/task-detail/task-detail.module';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { InboxModule } from '@/app/dashboard/modules/inbox/inbox.module';
import { RxFor } from '@rx-angular/template/for';
import { SmsMessageIndexComponent } from './components/sms-message-index/sms-message-index.component';
import { SmsMessageDetailListModule } from './components/sms-message-detail-list/sms-message-detail-list.module';
import { SmsMessageDetailComponent } from './components/sms-message-detail/sms-message-detail.component';
import { SmsMessageItemComponent } from './components/sms-message-item/sms-message-item.component';
import { SmsMessageIndexListComponent } from './components/sms-message-index-list/sms-message-index-list.component';
import { SharedModule as InboxSharedModule } from '@/app/dashboard/modules/inbox/shared/shared.module';

@NgModule({
  declarations: [
    SmsViewComponent,
    SmsMessageIndexComponent,
    SmsMessageItemComponent,
    SmsMessageIndexListComponent
  ],
  imports: [
    CommonModule,
    SmsViewRoutingModule,
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
    InfiniteScrollModule,
    TaskDetailModule,
    NzMenuModule,
    NzDropDownModule,
    InboxModule,
    NzTabsModule,
    RxFor,
    SmsMessageDetailListModule,
    SmsMessageDetailComponent,
    InboxSharedModule
  ]
})
export class SmsViewModule {}
