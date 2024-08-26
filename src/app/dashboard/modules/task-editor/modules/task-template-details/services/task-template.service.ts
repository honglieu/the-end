import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  ITaskTemplate,
  IUpdateTaskTemplate
} from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { TaskTemplateApiService } from './task-template-api.service';
import { TaskTemplateHelper } from '@/app/dashboard/modules/task-editor/modules/task-template-details/helper/task-template.helper';
import { RegionInfo } from '@shared/types/agency.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskTemplateService {
  private taskTemplate: BehaviorSubject<ITaskTemplate> = new BehaviorSubject(
    null
  );
  public taskTemplate$ = this.taskTemplate.asObservable();
  private regions: BehaviorSubject<RegionInfo[]> = new BehaviorSubject(null);
  public regions$ = this.regions.asObservable();
  public currentCrmLogoBS: BehaviorSubject<string> = new BehaviorSubject('');

  constructor(private taskTemplateApiService: TaskTemplateApiService) {}

  public setTaskTemplate(value: ITaskTemplate) {
    const defaultTemplate = {
      isTemplate: false,
      hasAISummary: false,
      data: {
        steps: [],
        decisions: []
      },
      decisionIndex: null,
      setting: {
        categoryId: '',
        taskNameId: ''
      }
    };
    if (value) {
      value.template.decisionIndex = null;
      value.template = Object.assign(defaultTemplate, value.template);
      value.template = TaskTemplateHelper.templateToTreeView(value.template);
    }
    TaskTemplateHelper.getListDynamicByConfig(value?.crmSystemKey);
    this.taskTemplate.next(value);
  }

  public updateTaskTemplate(data: IUpdateTaskTemplate, isConsole: boolean) {
    return this.taskTemplateApiService.updateTaskTemplate(
      this.taskTemplate.value?.id,
      data,
      isConsole
    );
  }

  public setRegions(value: RegionInfo[]) {
    this.regions.next(value);
  }
}
