import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TaskNameId } from '@shared/enum/task.enum';
import { TaskName } from '@shared/types/task.interface';

export interface TaskConvertPrefill {
  taskName?: string;
  taskTitle?: string;
  taskType?: string;
  taskSummary?: string;
  region?: {
    id: string;
    name: string;
  };
  operationMode?: 'auto' | 'manual';
}

@Injectable({
  providedIn: 'root'
})
export class TaskConvertPrefillService {
  private prefillContentSource$ =
    new BehaviorSubject<TaskConvertPrefill | null>(null);
  private isLoadingSource$ = new BehaviorSubject<boolean>(false);

  public prefillContent$: Observable<TaskConvertPrefill | null> =
    this.prefillContentSource$.asObservable();

  public isLoading$: Observable<boolean> = this.isLoadingSource$.asObservable();

  // prevent set prefill content when user select task manually on conver-to-task-dropdown.component
  private allowPreventSetPrefillContent = true;

  private readonly taskSummaryDefault: string = '';

  public setPrefillContent(content: TaskConvertPrefill | null): void {
    if (this.allowPreventSetPrefillContent) {
      this.prefillContentSource$.next(content);
    }
  }

  public patchPrefillContent(value: TaskConvertPrefill): void {
    if (this.allowPreventSetPrefillContent) {
      const prefillContent = this.prefillContentSource$.getValue();
      this.prefillContentSource$.next(
        Object.assign(prefillContent ?? {}, value)
      );
    }
  }

  public allowSetPrefillContent(): void {
    this.allowPreventSetPrefillContent = true;
  }

  public preventSetFrefillContent(): void {
    this.allowPreventSetPrefillContent = false;
  }

  public setLoading(isLoading: boolean): void {
    this.isLoadingSource$.next(isLoading);
  }

  public getTaskTitleDefault(selectedTask?: TaskName): string {
    switch (selectedTask?.id) {
      case TaskNameId.routineMaintenance:
        return 'Maintenance';
      case TaskNameId.emergencyMaintenance:
        return 'Emergency';
      default:
        return selectedTask?.label;
    }
  }

  public getTaskSummaryDefault(): string {
    return this.taskSummaryDefault;
  }
}
