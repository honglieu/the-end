import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { UserProfileComponent } from './user-profile.component';
import { PictureProfilePopup } from './picture-profile-popup/picture-profile-popup.component';
import { ChangePasswordPopup } from './change-password-popup/change-password-popup.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { FormsModule } from '@angular/forms';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { FormatColorRoleProfilePipe } from './format-color-role-profile.pipe';
import { DeleteAccountPopupComponent } from './delete-account-popup/delete-account-popup.component';
import { AccountSettingsComponent } from '@/app/account-settings/account-settings.component';
import { EmailSignaturePopupComponent } from './email-signature-popup/email-signature-popup.component';
import { UserProfileService } from '@/app/user-profile/services/user-profile.service';
import { EmailSignaturePreviewComponent } from './email-signature-preview/email-signature-preview.component';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ImageCropperModule,
    SharePopUpModule,
    FormsModule,
    NzSkeletonModule,
    NzSliderModule,
    TrudiUiModule
  ],
  declarations: [
    UserProfileComponent,
    PictureProfilePopup,
    ChangePasswordPopup,
    FormatColorRoleProfilePipe,
    DeleteAccountPopupComponent,
    AccountSettingsComponent,
    EmailSignaturePopupComponent,
    EmailSignaturePreviewComponent
  ],
  exports: [FormatColorRoleProfilePipe, ChangePasswordPopup],
  providers: [UserProfileService]
})
export class UserProfileModule {}
