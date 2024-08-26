import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SummaryMessageDialogComponent } from './summary-message-dialog.component';
import { SharedModule } from '@shared/shared.module';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzNoAnimationModule } from 'ng-zorro-antd/core/no-animation';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { PreventButtonModule } from '@trudi-ui';
import { TrudiModule } from '@/app/task-detail/modules/trudi/trudi.module';
import { AiSumaryDetailModule } from '@/app/task-detail/modules/app-chat/components/ai-summary/ai-summary.module';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import { SummaryMessageDialogItemComponent } from './components/summary-message-dialog-item/summary-message-dialog-item.component';
import { MessageViaEmailModule } from '@shared/components/chat/message-via-email/message-via-email.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SummaryMessageDialogFileComponent } from './components/summary-message-dialog-file/summary-message-dialog-file.component';
import { TrudiUiModule } from '@trudi-ui';
import { LottieModule } from 'ngx-lottie';
import { RxPush } from '@rx-angular/template/push';
@NgModule({
  declarations: [
    SummaryMessageDialogComponent,
    SummaryMessageDialogItemComponent,
    SummaryMessageDialogFileComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    TrudiModule,
    TrudiUiModule,
    NzDropDownModule,
    NzNoAnimationModule,
    TrudiSendMsgModule,
    NzSkeletonModule,
    NzToolTipModule,
    PreventButtonModule,
    AiSumaryDetailModule,
    NzResizableModule,
    MessageViaEmailModule,
    DragDropModule,
    LottieModule,
    RxPush
  ],
  exports: [SummaryMessageDialogComponent, SummaryMessageDialogFileComponent]
})
export class SummaryMessageDialogModule {}
