import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  IStatisticsEmail,
  ITaskFolder,
  ITaskGroup
} from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { TaskStatusType } from '@shared/enum/task.enum';
import { cloneDeep } from 'lodash-es';
import { Store } from '@ngrx/store';
import { selectAllTaskFolder } from '@core/store/taskFolder/selectors/task-folder.selectors';
import { taskFolderActions } from '@core/store/taskFolder/actions/task-folder.actions';

@Injectable({
  providedIn: 'root'
})
export class InboxSidebarService {
  public isAccountAdded: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public syncMailBoxSuccess$ = new BehaviorSubject<boolean>(true);
  public refreshStatisticsUnreadTask$ = new Subject<string>();
  public refreshStatisticUnreadTaskChannel$ = new Subject<string>();
  // Only used in case of data refresh. In this case, the total count will be re-maped immediately after refresh without waiting for the statistics api
  public isUpdateTaskFolder: boolean = false;
  private inboxTaskFoldersBS: BehaviorSubject<ITaskFolder[]> =
    new BehaviorSubject(null);
  public taskFolders$: Observable<ITaskFolder[]> =
    this.inboxTaskFoldersBS.asObservable();
  public openCreateSidebar: BehaviorSubject<boolean> = new BehaviorSubject(
    null
  );
  public openCreateSendMessage: Subject<boolean> = new Subject();
  private statisticsEmailBS: BehaviorSubject<IStatisticsEmail[]> =
    new BehaviorSubject<IStatisticsEmail[]>([]);
  private statisticsAppMessageBS: BehaviorSubject<IStatisticsEmail[]> =
    new BehaviorSubject<IStatisticsEmail[]>([]);

  private statisticsVoiceMailMessageBS: BehaviorSubject<IStatisticsEmail[]> =
    new BehaviorSubject<IStatisticsEmail[]>([]);

  public statisticsEmail$ = this.statisticsEmailBS.asObservable();
  public statisticsAppMessage$ = this.statisticsAppMessageBS.asObservable();
  public statisticsVoiceMailMessage$ =
    this.statisticsVoiceMailMessageBS.asObservable();

  private statisticsFacebookMessageBS: BehaviorSubject<IStatisticsEmail[]> =
    new BehaviorSubject<IStatisticsEmail[]>([]);
  public statisticsFacebookMessageBS$ =
    this.statisticsFacebookMessageBS.asObservable();

  private statisticsSmsMessageBS: BehaviorSubject<IStatisticsEmail[]> =
    new BehaviorSubject<IStatisticsEmail[]>([]);
  public statisticsSmsMessage$ = this.statisticsSmsMessageBS.asObservable();

  private statisticsWhatsappMessageBS: BehaviorSubject<IStatisticsEmail[]> =
    new BehaviorSubject<IStatisticsEmail[]>([]);
  public statisticsWhatsappMessageBS$ =
    this.statisticsWhatsappMessageBS.asObservable();

  constructor(private readonly store: Store) {
    this.store.select(selectAllTaskFolder).subscribe((res) => {
      const sortedFolder =
        Array.isArray(res) && res?.length ? this.sortFolderByOrder(res) : [];
      this.inboxTaskFoldersBS.next(sortedFolder);
    });
  }

  getAccountAdded(): Observable<boolean> {
    return this.isAccountAdded.asObservable();
  }

  setAccountAdded(value: boolean) {
    this.isAccountAdded.next(value);
  }

  setStatisticsEmail(value: IStatisticsEmail[]) {
    this.statisticsEmailBS.next(value);
  }

  setStatisticsAppMessage(value: IStatisticsEmail[]) {
    this.statisticsAppMessageBS.next(value);
  }

  setStatisticsSmsMessage(value: IStatisticsEmail[]) {
    this.statisticsSmsMessageBS.next(value);
  }

  setStatisticsVoiceMailMessage(value: IStatisticsEmail[]) {
    this.statisticsVoiceMailMessageBS.next(value);
  }

  setStatisticsFacebookMessage(value: IStatisticsEmail[]) {
    this.statisticsFacebookMessageBS.next(value);
  }

  setStatisticsWhatsappMessage(value: IStatisticsEmail[]) {
    this.statisticsWhatsappMessageBS.next(value);
  }

  public refreshStatisticsUnreadTask(value: string) {
    value && this.refreshStatisticsUnreadTask$.next(value);
  }

  public refreshStatisticUnreadTaskChannel(value: string) {
    value && this.refreshStatisticUnreadTaskChannel$.next(value);
  }

  public setInboxTaskFolder(value: ITaskFolder[]) {
    this.store.dispatch(
      taskFolderActions.setAll({
        taskFolders: Array.isArray(value) ? cloneDeep(value) : []
      })
    );
  }

  public updateTaskGroupInFolder(
    taskGroups: ITaskGroup[],
    taskFolderId: string
  ) {
    const newTaskFolders = this.inboxTaskFoldersBS.getValue().map((tf) => {
      if (taskFolderId === tf.id) {
        return { ...tf, taskGroups: taskGroups };
      }
      return tf;
    });
    this.setInboxTaskFolder(newTaskFolders);
  }

  public handleSocketCreateTaskFolder(data) {
    const { taskFolder, taskGroups } = data || {};
    const currentTaskFolders = cloneDeep(this.inboxTaskFoldersBS.value);
    const existTaskFolderIndex = currentTaskFolders.findIndex(
      (it) => it.id === taskFolder.id
    );
    if (existTaskFolderIndex === -1) {
      const newTaskFolder = {
        ...taskFolder,
        taskGroups: taskGroups,
        taskCount: 0,
        canEditFolder: true,
        routerLink: 'tasks',
        queryParams: {
          taskTypeID: taskFolder?.id,
          aiAssistantType: null,
          taskStatus: TaskStatusType.inprogress
        }
      };
      currentTaskFolders.push(newTaskFolder);
      this.setInboxTaskFolder(currentTaskFolders);
    }
  }

  public handleSocketUpdateTaskFolder(data) {
    const currentTaskFolders = cloneDeep(this.inboxTaskFoldersBS.value);
    const newTaskFolders = currentTaskFolders.map((it) => {
      const updateTaskFolderIndex = data.findIndex((v) => v.id === it.id);
      if (updateTaskFolderIndex > -1) {
        return {
          ...it,
          ...data[updateTaskFolderIndex]
        };
      }
      return it;
    });
    this.setInboxTaskFolder(newTaskFolders);
  }

  public handleSocketDeleteTaskFolder(data) {
    const currentTaskFolders = cloneDeep(this.inboxTaskFoldersBS.value);
    const existTaskFolderIndex = currentTaskFolders.findIndex(
      (it) => it.id === data.id
    );
    if (existTaskFolderIndex > -1) {
      const newTaskFolders = currentTaskFolders.filter(
        (it) => it.id !== data.id
      );
      this.setInboxTaskFolder(newTaskFolders);
    }
  }

  public isCompletedGroup(taskFolderId: string, taskGroupId: string): boolean {
    return this.inboxTaskFoldersBS.value
      ?.find((taskFolder) => taskFolder.id === taskFolderId)
      ?.taskGroups?.find((taskGroup) => taskGroup.id === taskGroupId)
      ?.isCompletedGroup;
  }

  sortFolderByOrder(taskFolders: ITaskFolder[]) {
    return taskFolders.sort((a, b) => {
      if (a.order === b.order) return a.name[0].localeCompare(b.name[0]);
      return a.order > b.order ? 1 : -1;
    });
  }
}
