import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import {
  ETaskTemplateStatus,
  EToolbarConfig
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import {
  ITaskTemplate,
  ToolbarTaskEditor
} from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskEditorListViewService {
  private listToolbarConfig: BehaviorSubject<ToolbarTaskEditor[]> =
    new BehaviorSubject<ToolbarTaskEditor[]>([]);
  private taskEditorTemplate: Subject<ITaskTemplate[]> = new Subject<
    ITaskTemplate[]
  >();
  private crmSystemSelected: BehaviorSubject<string> =
    new BehaviorSubject<string>(null);

  constructor(private activeRouter: ActivatedRoute) {}

  get listToolbarConfig$(): Observable<ToolbarTaskEditor[]> {
    return this.listToolbarConfig.asObservable();
  }

  setListToolbarConfig(value: ToolbarTaskEditor[]) {
    this.listToolbarConfig.next(value);
  }

  get crmSystemSelected$(): Observable<string> {
    return this.crmSystemSelected.asObservable();
  }

  setCrmSystemSelected(value: string) {
    this.crmSystemSelected.next(value);
  }

  getListToolbarTaskEditor(
    config: ToolbarTaskEditor[],
    selectedIds: string[],
    isContactPage: boolean = false
  ) {
    const keyParam = this.activeRouter.snapshot.queryParams['status'];

    const filters: Record<
      ETaskTemplateStatus,
      (item: ToolbarTaskEditor) => boolean
    > = {
      [ETaskTemplateStatus.PUBLISHED]: (item) =>
        item.label !== EToolbarConfig.Published,
      [ETaskTemplateStatus.DRAFT]: (item) =>
        item.label !== EToolbarConfig.MoveToDraft,
      [ETaskTemplateStatus.ARCHIVED]: (item) =>
        item.label !== EToolbarConfig.Archive
    };

    const filterFunction = filters[keyParam] || (() => false);
    let toolbarConfig: ToolbarTaskEditor[] = config;
    const isConsoleSettings = window.location.href.includes('console-settings');
    let taskLabel = isConsoleSettings ? 'task template' : 'task';

    if (!isContactPage) {
      toolbarConfig = config.filter(filterFunction);
    }

    if (selectedIds?.length > 0) {
      if (isContactPage) {
        taskLabel = 'Contact';
        if (toolbarConfig[0].count) {
          toolbarConfig.shift();
        }
      }
      toolbarConfig.unshift({
        count: selectedIds?.length || 0,
        label: 'Selected'
      });
    }

    this.listToolbarConfig.next(toolbarConfig);
  }

  getTaskEditorTemplate(): Observable<ITaskTemplate[]> {
    return this.taskEditorTemplate.asObservable();
  }

  setTaskEditorTemplate(value: ITaskTemplate[]) {
    this.taskEditorTemplate.next(value);
  }
}
