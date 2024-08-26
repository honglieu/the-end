import { StepsModule } from './../steps/steps.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrudiComponent } from './trudi.component';
import { ConvertToTaskSuperHappyPathComponent } from './convert-to-task-super-happy-path/convert-to-task-super-happy-path.component';
import { PropertyTreeNotificationComponent } from './property-tree-notification/property-tree-notification.component';
import { SelectSupplierComponent } from './select-supplier/select-supplier.component';
import { ConvertToTaskUnhappyPathComponent } from './unhappy-path/convert-to-task-unhappy-path/convert-to-task-unhappy-path.component';
import { MoveToTaskUnhappyPathComponent } from './unhappy-path/move-to-task-unhappy-path/move-to-task-unhappy-path.component';
import { UnhappyPathComponent } from './unhappy-path/unhappy-path.component';
import { NotificationPopupComponent } from './notification-popup/notification-popup.component';
import { SharedModule } from '@shared/shared.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MaintenanceRequestModule } from '@/app/maintenance-request/maintenance-request.module';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { SelectMoveTaskComponent } from '@/app/task-detail/modules/trudi/select-move-task/select-move-task.component';
import { SendInvoicePtComponent } from './send-invoice-pt/send-invoice-pt.component';
import { SendQuoteLandlordComponent } from './send-quote-landlord/send-quote-landlord.component';
import { TaskModule } from '@/app/task/task.module';
import { ConvertToTaskDropdownModule } from '@shared/components/convert-to-task-dropdown/convert-to-task-dropdown.module';
import { CreateNewContactPopupComponent } from './app-dropdown-trudi/create-new-contact-popup/create-new-contact-popup.component';
import { AppUnhappyPathTrudiComponent } from './app-dropdown-trudi/app-unhappy-path-trudi.component';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    MoveMessToDifferentTaskModule,
    MaintenanceRequestModule,
    SharePopUpModule,
    ConvertToTaskDropdownModule,
    ScrollingModule,
    StepsModule,
    TaskModule,
    RxPush
  ],
  declarations: [
    NotificationPopupComponent,
    TrudiComponent,
    ConvertToTaskSuperHappyPathComponent,
    PropertyTreeNotificationComponent,
    SelectSupplierComponent,
    UnhappyPathComponent,
    MoveToTaskUnhappyPathComponent,
    ConvertToTaskUnhappyPathComponent,
    SelectMoveTaskComponent,
    SendInvoicePtComponent,
    SendQuoteLandlordComponent,
    CreateNewContactPopupComponent,
    AppUnhappyPathTrudiComponent
  ],
  exports: [
    NotificationPopupComponent,
    ConvertToTaskSuperHappyPathComponent,
    PropertyTreeNotificationComponent,
    SelectSupplierComponent,
    UnhappyPathComponent,
    MoveToTaskUnhappyPathComponent,
    ConvertToTaskUnhappyPathComponent,
    TrudiComponent,
    SendInvoicePtComponent,
    SendQuoteLandlordComponent
  ]
})
export class TrudiModule {}
