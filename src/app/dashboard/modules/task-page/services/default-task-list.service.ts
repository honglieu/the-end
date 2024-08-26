import { switchMap } from 'rxjs/operators';
import { BehaviorSubject, Observable, filter } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  IGetTaskByFolder,
  IGetTasksByGroupPayload
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { TaskApiService } from './task-api.service';

@Injectable()
export class DefaultTaskListService {
  private refreshTaskList = new BehaviorSubject<IGetTasksByGroupPayload>(null);
  public refreshTaskList$ = this.refreshTaskList.asObservable();

  constructor(private taskApiService: TaskApiService) {}

  getAllTask(): Observable<IGetTaskByFolder> {
    return this.refreshTaskList$.pipe(
      filter((res) => !!res),
      switchMap((res) => {
        return this.taskApiService.getTasksByGroup(res);
      })
    );
  }

  fetchTaskList(payload) {
    this.refreshTaskList.next({
      ...this.refreshTaskList.value,
      ...payload
    });
  }
}
