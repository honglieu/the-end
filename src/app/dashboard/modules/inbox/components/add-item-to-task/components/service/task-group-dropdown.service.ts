import { DateCasePipe, TaskStatusType } from '@/app/shared';
import { Injectable } from '@angular/core';
import { TaskDateCasePipe } from '@/app/dashboard/modules/task-page/modules/task-preview/pipe/task-date-case.pipe';
import { map } from 'rxjs';
import { TIME_NOW } from '@/app/dashboard/utils/constants';
import dayjs from 'dayjs';

@Injectable()
export class TaskGroupDropdownService {
  constructor(
    private taskDateCasePipe: TaskDateCasePipe,
    private dateCasePipe: DateCasePipe
  ) {}

  mapToGetStatusBadge(taskList) {
    return taskList
      ?.map((topic) =>
        topic?.tasks?.length
          ? {
              ...topic,
              tasks: topic?.tasks.map((task) => ({
                ...task,
                statusBadge: this.getStatusBadge(
                  task?.status,
                  task?.createdAt,
                  task?.updatedAt
                )
              }))
            }
          : null
      )
      .filter(Boolean);
  }

  getStatusBadge(status: TaskStatusType, createdAt: string, updatedAt: string) {
    const taskDateCase =
      this.taskDateCasePipe.transform(status, createdAt, updatedAt) + ' ';
    switch (status) {
      case TaskStatusType.completed:
        return this.dateCasePipe
          .transform(updatedAt)
          .pipe(map((date) => taskDateCase + (date === TIME_NOW ? '' : date)));
      case TaskStatusType.inprogress:
      default:
        return this.dateCasePipe
          .transform(createdAt)
          .pipe(map((date) => taskDateCase + (date === TIME_NOW ? '' : date)));
    }
  }

  sortTasks(tasks) {
    return tasks.sort((a, b) => {
      if (a.updatedAt && b.updatedAt) {
        const timeDiff = dayjs(b.updatedAt).diff(dayjs(a.updatedAt));
        if (timeDiff !== 0) {
          return timeDiff;
        } else {
          return a.title.localeCompare(b.title);
        }
      }
      return 0;
    });
  }
}
