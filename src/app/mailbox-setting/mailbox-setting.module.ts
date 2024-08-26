import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzImageModule } from 'ng-zorro-antd/image';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MailboxSettingComponent } from './mailbox-setting.component';
import { MailBoxSettingViewRoutingModule } from './mailbox-setting-routing.module';
import { DashboardSharedModule } from '@/app/dashboard/shared/dashboard-shared.module';
import { SharedModule } from '@shared/shared.module';
import { RouterModule } from '@angular/router';
import { TrudiUiModule } from '@trudi-ui';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TeamPermissionsComponent } from './components/team-permissions/team-permissions.component';
import { EmailSignatureComponent } from './components/email-signature/email-signature.component';
import { MailboxBehavioursComponent } from './components/mailbox-behaviours/mailbox-behaviours.component';
import { AccountComponent } from './components/account/account.component';
import { ArchiveAccountPopupComponent } from './components/account/archive-account-popup/archive-account-popup.component';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AvatarSkeletonComponent } from './components/team-permissions/avatar-skeleton/avatar-skeleton.component';
import { OutOfOfficeComponent } from './components/out-of-office/out-of-office.component';
import { OfficeAddContactCardComponent } from './components/out-of-office/office-add-contact-card/office-add-contact-card.component';
import { OutOfOfficeFormService } from './services/out-of-office-form.service';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { OverlayModule } from '@angular/cdk/overlay';
import { AutosizeModule } from 'ngx-autosize';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';

@NgModule({
  declarations: [
    MailboxSettingComponent,
    TeamPermissionsComponent,
    EmailSignatureComponent,
    MailboxBehavioursComponent,
    AccountComponent,
    ArchiveAccountPopupComponent,
    AvatarSkeletonComponent,
    OutOfOfficeComponent,
    OfficeAddContactCardComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    TrudiUiModule,
    ScrollingModule,
    NzSkeletonModule,
    NzImageModule,
    InfiniteScrollModule,
    MailBoxSettingViewRoutingModule,
    DashboardSharedModule,
    NzToolTipModule,
    TrudiSendMsgModule,
    TrudiDatePickerModule,
    OverlayModule,
    AutosizeModule,
    SharePopUpModule
  ],
  providers: [OutOfOfficeFormService]
})
export class MailboxSettingModule {}
