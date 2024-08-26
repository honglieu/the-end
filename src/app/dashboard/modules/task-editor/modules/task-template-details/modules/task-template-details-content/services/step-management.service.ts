import { TreeNodeOptions } from '@/app/dashboard/modules/task-editor/modules/task-template-details/modules/task-template-details-content/components/tree-view/types/tree-node.interface';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {
  ECalendarEvent,
  EComponentTypes,
  ESelectStepType,
  EStepAction,
  EStepType
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class StepManagementService {
  private isSelectStepOpenSubject = new Subject<boolean>();
  public selectStepValue$ = this.isSelectStepOpenSubject.asObservable();
  private selectedStepType = new Subject<ESelectStepType | EStepType>();
  public selectedStepTypeValue$ = this.selectedStepType.asObservable();
  private isEditingForm: boolean = false;
  private isDrawerJiggled: boolean = false;
  private selectedHelpDocumentStepType = new Subject<
    EStepAction | ECalendarEvent | EComponentTypes
  >();
  public selectedHelpDocumentStepType$ =
    this.selectedHelpDocumentStepType.asObservable();

  private targetedNode: TreeNodeOptions;

  constructor(private toastService: ToastrService) {}

  public handleSelect(data: boolean) {
    this.isSelectStepOpenSubject.next(data);
  }

  public setSelectStepType(step: ESelectStepType | EStepType) {
    this.selectedStepType.next(step);
  }

  public setSelectedHelpDocumentStepType(
    step: EStepAction | ECalendarEvent | EComponentTypes
  ) {
    this.selectedHelpDocumentStepType.next(step);
  }

  public setTargetedNode(node: TreeNodeOptions) {
    this.targetedNode = node;
  }

  public getTargetedNode() {
    return this.targetedNode;
  }

  setIsDrawerJiggled(status: boolean) {
    this.isDrawerJiggled = status;
  }

  setIsEditingForm(isEditing: boolean) {
    this.isEditingForm = isEditing;
  }

  shouldWarningUnsavedChanges() {
    if (this.isEditingForm && !this.isDrawerJiggled) {
      this.toastService.error('You have unsaved changes');
      this.isDrawerJiggled = true;
      return true;
    }
    return false;
  }
}
