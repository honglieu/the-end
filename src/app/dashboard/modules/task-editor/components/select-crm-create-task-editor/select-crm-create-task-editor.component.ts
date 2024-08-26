import { Component, OnInit } from '@angular/core';
import {
  ECreatePopupType,
  PopUpEnum
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TaskEditorListViewService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/task-editor-list-view.service';
import { ConsoleTaskEditorApiService } from '@/app/dashboard/modules/task-editor/modules/task-template-list-view/services/console/task-editor-api.console.service';
import { ICrmSystem } from '@/app/dashboard/modules/task-editor/interfaces/task-template.interface';
import { TaskEditorService } from '@/app/dashboard/modules/task-editor/services/task-editor.service';
import { ECRMId } from '@shared/enum/share.enum';

@Component({
  selector: 'select-crm-create-task-editor',
  templateUrl: './select-crm-create-task-editor.component.html',
  styleUrls: ['./select-crm-create-task-editor.component.scss']
})
export class SelectCrmCreateTaskEditorComponent implements OnInit {
  public popupState: ECreatePopupType = ECreatePopupType.SELECT_CRM;
  public typeCreateTaskEditor = ECreatePopupType;
  public crmSystemId: string = '';
  public listCrmSystem: ICrmSystem[] = [];
  constructor(
    public taskEditorService: TaskEditorService,
    public taskEditorListViewService: TaskEditorListViewService,
    public consoleTaskEditorApiService: ConsoleTaskEditorApiService
  ) {}

  ngOnInit(): void {
    this.consoleTaskEditorApiService.getCrmSystem().subscribe((res) => {
      if (res) {
        this.listCrmSystem = res.filter((item) =>
          [ECRMId.RENT_MANAGER, ECRMId.PROPERTY_TREE].includes(item.id)
        );
        this.crmSystemId = this.listCrmSystem.find(
          (item) => item.id === ECRMId.PROPERTY_TREE
        ).id;
        this.taskEditorListViewService.setCrmSystemSelected(this.crmSystemId);
      }
    });
  }

  handleActive(id: string) {
    this.crmSystemId = id;
    this.taskEditorListViewService.setCrmSystemSelected(this.crmSystemId);
  }

  handleNextCreateTaskEditor() {
    this.taskEditorService.setPopupTaskEditorState(PopUpEnum.PopupCreateTask);
  }

  onCancel() {
    this.taskEditorService.setPopupTaskEditorState(null);
  }

  handleBack() {
    this.popupState = ECreatePopupType.SELECT_CRM;
  }
}
