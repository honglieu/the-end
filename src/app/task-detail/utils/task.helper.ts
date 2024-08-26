import { EAppMessageCreateType } from '@/app/dashboard/modules/inbox/modules/app-message-list/enum/message.enum';

export class TaskHelper {
  static isCreateAppMsg(
    url: string = '',
    fromTaskDetail: boolean = true
  ): boolean {
    if (!fromTaskDetail) {
      return (
        !url.includes(EAppMessageCreateType.NewAppMessageDone) &&
        url.includes(EAppMessageCreateType.NewAppMessage)
      );
    }
    return (
      url.includes('inbox/detail') &&
      !url.includes(EAppMessageCreateType.NewAppMessageDone) &&
      url.includes(EAppMessageCreateType.NewAppMessage)
    );
  }
}
