import { Component, Input } from '@angular/core';
import { User } from '@shared/types/user.interface';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss']
})
export class UserAvatarComponent {
  @Input() avatar: string;
  @Input() user: User;
  @Input() style: string;
  @Input() disablePreview = true;
  @Input() round = true;

  checkAvatar(): boolean {
    return this.avatar && !this.avatar?.includes('google_avatar');
  }
}
