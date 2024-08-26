import { UserService } from '@/app/dashboard/services/user.service';
import { DialogService } from '@services/dialog.service';
import { Injectable } from '@angular/core';
import { filter, map, take } from 'rxjs';
import { AddToTaskWarningComponent } from './add-to-task-warning.component';

@Injectable()
export class AddToTaskWarningService {
  constructor(
    private userService: UserService,
    private dialogService: DialogService<AddToTaskWarningComponent>
  ) {}

  public showWarningAddToTask(
    callback: Function,
    thisObj: any,
    args: any[] = [],
    inputData?: { isMultipleEmail: boolean }
  ) {
    this.isShowAddToTaskWarning()
      .pipe(take(1))
      .subscribe((isShow) => {
        if (isShow) {
          this.openAddToTaskModal(inputData)
            .afterClose.pipe(filter((v) => !!v))
            .subscribe(() => {
              callback.call(thisObj, ...args);
            });
        } else {
          callback.call(thisObj, ...args);
        }
      });
  }

  isShowAddToTaskWarning() {
    return this.userService
      .getUserDetail()
      .pipe(
        map((user) => user.userOnboarding.showMoveMessageWarning !== false)
      );
  }

  openAddToTaskModal(inputData) {
    return this.dialogService.createDialog(
      AddToTaskWarningComponent,
      inputData
    );
  }
}
