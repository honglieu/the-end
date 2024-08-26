import { Pipe, PipeTransform } from '@angular/core';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import {
  EFolderType,
  ITaskFolderRoute
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { EInboxFilterSelected } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { Params } from '@angular/router';

@Pipe({
  name: 'taskFolderSelected'
})
export class TaskFolderSelectedPipe implements PipeTransform {
  transform(child, currentQueryParam: Params, item: ITaskFolderRoute): boolean {
    if (!child || !currentQueryParam || !item) {
      return false;
    }

    if (item.folderType === EFolderType.MORE) {
      const { status, aiAssistantType } = child?.queryParams;
      const statusQueryParam = currentQueryParam?.[ETaskQueryParams.STATUS];
      const aiAssistantTypeQueryParam =
        currentQueryParam?.[EInboxFilterSelected.AI_ASSISTANT_TYPE];
      return (
        (!!statusQueryParam && statusQueryParam === status) ||
        (!!aiAssistantTypeQueryParam &&
          aiAssistantTypeQueryParam === aiAssistantType)
      );
    } else {
      return currentQueryParam?.[ETaskQueryParams.TASKTYPEID] === child.id;
    }
  }
}
