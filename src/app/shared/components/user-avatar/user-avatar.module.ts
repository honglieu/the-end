import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserAvatarComponent } from './user-avatar.component';
import { NzImageModule } from 'ng-zorro-antd/image';
import { FormatShortName } from './format-user-name.pipe';

@NgModule({
  imports: [CommonModule, NzImageModule],
  declarations: [UserAvatarComponent, FormatShortName],
  exports: [UserAvatarComponent, FormatShortName]
})
export class UserAvatarModule {}
