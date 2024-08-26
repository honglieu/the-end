import { Injectable } from '@angular/core';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { conversations } from '@/environments/environment';
import { ITasksActivityPayload, TaskItem } from '@shared/types/task.interface';

@Injectable({
  providedIn: 'root'
})
export class SyncTaskActivityService {
  constructor(private apiService: ApiService) {}
  private listTaskActivity: BehaviorSubject<{
    tasks: ITaskRow[] | TaskItem[];
    isDownloadPDFOption: boolean;
  }> = new BehaviorSubject(null);
  public listTaskActivity$ = this.listTaskActivity.asObservable();
  private storeExportTaskActivityPayload =
    new BehaviorSubject<ITasksActivityPayload>(null);
  private triggerExportTaskActivityAction: BehaviorSubject<{
    payload: ITasksActivityPayload;
    isDownloadPDFAction: boolean;
  }> = new BehaviorSubject(null);
  public triggerExportTaskActivityAction$ =
    this.triggerExportTaskActivityAction.asObservable();
  private exportingPDFFileTaskIds: BehaviorSubject<string[]> =
    new BehaviorSubject([]);
  public exportingPDFFileTaskIds$ = this.exportingPDFFileTaskIds.asObservable();

  setListTasksActivity(
    tasks: ITaskRow[] | TaskItem[],
    isDownloadPDFOption = false
  ) {
    this.listTaskActivity.next({ tasks, isDownloadPDFOption });
  }

  setStoreExportTaskActivityPayload(payload: ITasksActivityPayload) {
    this.storeExportTaskActivityPayload.next(payload);
  }

  setExportingPDFFileTaskIds(taskIds: string[], remove: boolean = false) {
    const ids = remove
      ? this.exportingPDFFileTaskIds.value.filter((id) => !taskIds.includes(id))
      : [...this.exportingPDFFileTaskIds.value, ...taskIds];
    this.exportingPDFFileTaskIds.next(ids);
  }

  filterStoreExportTaskActivityPayload(taskIds: string[]) {
    const data = this.storeExportTaskActivityPayload.value;
    this.storeExportTaskActivityPayload.next({
      ...data,
      tasks: data.tasks.filter((task) =>
        taskIds.some((id) => task.taskId === id)
      )
    });
  }

  exportTaskActivityWithStoreData() {
    if (!this.storeExportTaskActivityPayload.value) return;
    return this.setTriggerExportTaskActivityAction(
      this.storeExportTaskActivityPayload.value,
      true
    );
  }

  setTriggerExportTaskActivityAction(
    payload: ITasksActivityPayload,
    isDownloadPDFAction: boolean = false
  ) {
    this.triggerExportTaskActivityAction.next({ payload, isDownloadPDFAction });
  }

  syncTaskActivityToPropertyTree(payload: ITasksActivityPayload) {
    return this.apiService.putAPI(conversations, 'task/sync', payload);
  }
}
