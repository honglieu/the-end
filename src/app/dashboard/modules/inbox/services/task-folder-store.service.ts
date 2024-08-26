import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { IGetTaskByFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';

export interface ITaskFolderStore {
  taskGroups: IGetTaskByFolder[];
  queryParams: Params;
}
export interface ITaskFoldersStore {
  [key: string]: ITaskFolderStore;
}
@Injectable({
  providedIn: 'root'
})
export class TaskFolderStoreService {
  private taskFolderStore = new BehaviorSubject<IGetTaskByFolder[]>(null);

  get taskFolderStore$() {
    return this.taskFolderStore.asObservable();
  }

  get getTaskFolderStore() {
    return this.taskFolderStore.getValue() || [];
  }

  setTaskFolderStore(value) {
    return this.taskFolderStore.next(value);
  }

  hasTaskFolder(taskFolderId: string) {
    return !!this.getTaskFolderStore[taskFolderId];
  }

  getCurrentCompletedGroup() {
    return this.getTaskFolderStore?.find(
      (group) => !!group.taskGroup.isCompletedGroup
    );
  }
}
