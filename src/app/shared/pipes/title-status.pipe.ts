import { TaskType } from './../../shared/enum/task.enum';
import { Pipe, PipeTransform } from '@angular/core';
import { TaskStatusTypeLC } from '@shared/enum/task.enum';

@Pipe({
  name: 'titleStatus'
})
export class TitleStatusPipe implements PipeTransform {
  transform(value: string, taskType: TaskType): string {
    if (!value) return value;
    value = value.toLowerCase();

    switch (value) {
      case TaskStatusTypeLC.inprogress:
      case TaskStatusTypeLC.unassigned:
        value = taskType === TaskType.MESSAGE ? 'open' : 'in progress';
        break;
      case TaskStatusTypeLC.deleted:
        value =
          taskType === TaskType.MESSAGE ? value : TaskStatusTypeLC.cancelled;
        break;
      case TaskStatusTypeLC.completed:
        value =
          taskType === TaskType.MESSAGE ? TaskStatusTypeLC.resolved : value;
        break;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
