import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  MarketingEmailSettingType,
  NotificationSettingPlatform,
  NotificationSettingType
} from '@shared/enum/user.enum';
interface EmailSetting {
  type: MarketingEmailSettingType | NotificationSettingType;
  platform: NotificationSettingPlatform;
  checked: boolean;
}
interface EmailToggle {
  label: string;
  settings: EmailSetting[];
}
@Component({
  selector: 'notifications-layout',
  templateUrl: './notifications-layout.component.html',
  styleUrls: ['./notifications-layout.component.scss']
})
export class NotificationsLayoutComponent implements OnInit, OnChanges {
  @Input() notifications: EmailToggle[];
  @Input() emailNoti: string;
  @Input() title: string;
  @Input() showHeader: boolean = true;
  @Output() onCheckboxChange = new EventEmitter();

  platforms: string[] = [];

  constructor() {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.notifications && this.notifications.length) {
      this.platforms = this.notifications[0].settings.map((i) => {
        switch (i.platform) {
          case NotificationSettingPlatform.DESKTOP:
            return 'App notification';
          case NotificationSettingPlatform.EMAIL:
          default:
            return 'Email';
        }
      });
    }
  }
  onChange(e, setting) {
    this.onCheckboxChange.emit({ event: e, value: setting });
  }
}
