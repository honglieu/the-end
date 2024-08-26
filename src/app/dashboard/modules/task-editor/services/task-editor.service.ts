import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PopUpEnum } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { EAddOn } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { PermissionService } from '@services/permission.service';
import { ECRMId } from '@shared/enum/share.enum';
import { CRMRegion } from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';

@Injectable()
export class TaskEditorService {
  private popupTaskEditor$: BehaviorSubject<PopUpEnum> =
    new BehaviorSubject<PopUpEnum>(null);
  private listDefaultRegion: BehaviorSubject<CRMRegion> =
    new BehaviorSubject<CRMRegion>({
      [ECRMId.PROPERTY_TREE]: [],
      [ECRMId.RENT_MANAGER]: []
    });
  constructor(public permissionService: PermissionService) {}

  get isConsoleSettings() {
    return window.location.href.includes('console-settings');
  }

  checkToDisableTaskEditor(addOns: EAddOn[]) {
    const canEdit = this.permissionService.hasFunction(
      this.isConsoleSettings
        ? 'TASK_EDITOR.TASK_TEMPLATES.EDIT'
        : 'TASK_EDITOR.TASKS.EDIT'
    );
    const hasTaskEditor = addOns?.some((item) => item === EAddOn.TASK_EDITOR);

    if (this.isConsoleSettings) {
      return !canEdit;
    }

    return !hasTaskEditor || !canEdit;
  }

  getPopupTaskEditorState(): Observable<PopUpEnum> {
    return this.popupTaskEditor$.asObservable();
  }

  setPopupTaskEditorState(value: PopUpEnum) {
    this.popupTaskEditor$.next(value);
  }

  getListDefaultRegion(): Observable<CRMRegion> {
    return this.listDefaultRegion.asObservable();
  }

  setListDefaultRegion(value: CRMRegion) {
    this.listDefaultRegion.next(value);
  }
}
