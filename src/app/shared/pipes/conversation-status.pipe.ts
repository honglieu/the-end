import { TaskStatusType } from '@shared/enum';
import { TitleCasePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'conversationStatus'
})
export class ConversationStatusPipe implements PipeTransform {
  constructor(private titleCase: TitleCasePipe) {}
  transform(value: string): {
    text: string;
    variant: string;
  } {
    switch (value) {
      case TaskStatusType.open:
      case TaskStatusType.reopen:
      case TaskStatusType.inprogress:
      case TaskStatusType.draft:
        return {
          text: this.titleCase.transform(TaskStatusType.open),
          variant: 'inProgress'
        };
      case TaskStatusType.resolved:
      case TaskStatusType.completed:
        return {
          text: this.titleCase.transform(TaskStatusType.resolved),
          variant: 'success'
        };
      case TaskStatusType.deleted:
        return {
          text: this.titleCase.transform(TaskStatusType.deleted),
          variant: 'error'
        };
      default:
        return {
          text: null,
          variant: null
        };
    }
  }
}
