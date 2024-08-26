import { EConversationStatus } from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'resultRowConversationStatus'
})
export class SearchResultRowConversationStatusPipe implements PipeTransform {
  transform(
    value: EConversationStatus,
    taskStatus: EConversationStatus
  ): string {
    if (taskStatus === EConversationStatus.deleted) {
      return 'Deleted';
    }
    switch (value) {
      case EConversationStatus.resolved:
        return 'Resolved';
      case EConversationStatus.deleted:
        return 'Deleted';
      case EConversationStatus.draft:
        return 'Updated';
      default:
        return 'Open';
    }
  }
}
