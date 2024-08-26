import { EMailBoxStatus } from '@shared/enum';
import { IMailBox } from '@shared/types/user.interface';

export function orderMailboxes(mailboxes: IMailBox[]) {
  const sortedMailboxes = mailboxes.sort((a, b) => {
    if (a.order !== null && b.order !== null) {
      return a.order - b.order;
    }
    if (a.order === null && b.order !== null) {
      return 1;
    }
    if (a.order !== null && b.order === null) {
      return -1;
    }
    if (
      a.status === EMailBoxStatus.SYNCING &&
      b.status !== EMailBoxStatus.SYNCING
    ) {
      return 1;
    }
    if (
      a.status !== EMailBoxStatus.SYNCING &&
      b.status === EMailBoxStatus.SYNCING
    ) {
      return -1;
    }
    return a.name.localeCompare(b.name);
  });

  return sortedMailboxes;
}
