import { Pipe, PipeTransform } from '@angular/core';
import { TaskStatusType } from '@shared/enum';

@Pipe({
  name: 'taskDateCase'
})
export class TaskDateCasePipe implements PipeTransform {
  transform(
    status: TaskStatusType,
    createdAt: string,
    updatedAtOfTask: string
  ): string {
    if (status === TaskStatusType.inprogress) {
      return `${this.capitalizeFirstLetter(
        `${this.formatTaskTime(createdAt)} created`
      )}`;
    }

    if (status === TaskStatusType.deleted) {
      return 'Task cancelled';
    }

    return this.capitalizeFirstLetter(
      `${this.formatTaskTime(updatedAtOfTask)} ${(status || '').toLowerCase()}`
    );
  }

  formatTaskTime(str: string) {
    if (str != null && str !== '') {
      const date = new Date(str).getTime();
      const currentDate = new Date();
      const currDate = currentDate.getTime();
      const SECOND_MILLIS = 1000;
      const MINUTE_MILLIS = 60 * SECOND_MILLIS;
      const diff = currDate - date;
      if (diff < MINUTE_MILLIS) {
        return 'Just';
      }
    }
    return '';
  }

  capitalizeFirstLetter(str: string) {
    const trimStr = str.trim();
    if (trimStr.length === 0) {
      return trimStr;
    }
    return trimStr.charAt(0).toUpperCase() + trimStr.slice(1);
  }
}
