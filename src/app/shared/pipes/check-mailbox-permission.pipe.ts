import { Pipe, PipeTransform } from '@angular/core';
import {
  EMailboxSettingTab,
  EUserMailboxRole
} from '@/app/mailbox-setting/utils/enum';

@Pipe({ name: 'checkMailboxPermission' })
export class CheckMailboxPermission implements PipeTransform {
  transform(
    roles: Array<keyof typeof EUserMailboxRole>,
    mailboxSettingTab?: EMailboxSettingTab
  ): boolean {
    if (!roles) return false;
    switch (mailboxSettingTab) {
      case EMailboxSettingTab.ACCOUNT:
        return roles.includes(EUserMailboxRole.OWNER);
      default:
        return roles.some((role) =>
          [EUserMailboxRole.ADMIN, EUserMailboxRole.OWNER].includes(
            role as EUserMailboxRole
          )
        );
    }
  }
}
