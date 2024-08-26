import { Component, OnInit } from '@angular/core';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  filter,
  takeUntil
} from 'rxjs';
import { IRentManagerNote } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/interfaces/rent-manager-notes.interface';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { RentManagerNotesFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/rent-manager-notes-form.service';
import { ERentManagerNotesPopup } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/enums/rent-manager-notes.enum';
import { ToastrService } from 'ngx-toastr';
import { TrudiService } from '@services/trudi.service';
import { TaskService } from '@services/task.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { DEBOUNCE_SOCKET_TIME } from '@services/constants';
import { RentManagerNoteApiService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/rent-manager-note-api.service';
import { PopupManagementService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/popup-management.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { EActionType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { ESyncStatus } from '@/app/task-detail/utils/functions';

@Component({
  selector: 'notes-rm-widget',
  templateUrl: './notes-rm-widget.component.html',
  styleUrls: ['./notes-rm-widget.component.scss']
})
export class NotesRmWidgetComponent implements OnInit {
  private destroy: Subject<void> = new Subject<void>();
  public rmNotes: IRentManagerNote[] = [];
  constructor(
    private widgetRMService: WidgetRMService,
    private rentManagerNotesFormService: RentManagerNotesFormService,
    private popupManagementService: PopupManagementService,
    private toastrService: ToastrService,
    private rentManagerNotesApiService: RentManagerNoteApiService,
    private rxWebsocketService: RxWebsocketService,
    private taskService: TaskService,
    private toastService: ToastrService,
    private trudiService: TrudiService,
    private stepService: StepService
  ) {}

  ngOnInit(): void {
    this.subscribeSocketUpdateStatusWidget();
    this.widgetRMService
      .getRMWidgetStateByType(RMWidgetDataField.RM_NOTES)
      .pipe(takeUntil(this.destroy))
      .subscribe((res) => {
        if (res) {
          this.rmNotes = res.sort((a, b) => {
            try {
              const timeA = new Date(a.details.createdAt);
              const timeB = new Date(b.details.createdAt);
              return timeB.getTime() - timeA.getTime();
            } catch {
              return 0;
            }
          }) as IRentManagerNote[];
        }
      });
  }
  handleClickRmNote(cardData) {
    this.widgetRMService.setPopupWidgetState(ERentManagerType.NOTES);
    this.popupManagementService.setCurrentPopup(
      ERentManagerNotesPopup.SYNC_NOTES
    );
    this.rentManagerNotesFormService.initData(cardData).buildForm();
    const { syncStatus, syncDate } = cardData;
    if (syncStatus) {
      this.rentManagerNotesFormService.setSyncStatusBS({
        syncStatus,
        syncDate
      });
    }
  }
  handleRetrySyncRmNote(cardData) {
    const updatedRmNotes = this.widgetRMService.notes.value.map((rmNote) => {
      if (rmNote.id === cardData.id) {
        return {
          ...rmNote,
          agencyId: this.taskService.currentTask$.value?.agencyId,
          syncStatus: ESyncStatus.INPROGRESS,
          syncDate: new Date()
        };
      }
      return rmNote;
    });
    this.widgetRMService.setRMWidgetStateByType(
      RMWidgetDataField.RM_NOTES,
      'UPDATE',
      updatedRmNotes
    );

    this.rentManagerNotesApiService.syncNoteToRM(cardData).subscribe({
      next: (res) => {
        if (res) {
          const updatedRmNotes = this.widgetRMService.notes.value.map(
            (rmNote) => {
              return rmNote.id === res.id ? res : rmNote;
            }
          );
          this.widgetRMService.setRMWidgetStateByType(
            RMWidgetDataField.RM_NOTES,
            'UPDATE',
            updatedRmNotes
          );
        }
      },
      error: (error) => {
        const updatedRmNotes = this.widgetRMService.notes.value.map(
          (rmNote) => {
            if (rmNote.id === cardData.id) {
              return {
                ...rmNote,
                syncStatus: ESyncStatus.FAILED,
                syncDate: new Date()
              };
            }
            return rmNote;
          }
        );
        this.widgetRMService.setRMWidgetStateByType(
          RMWidgetDataField.RM_NOTES,
          'UPDATE',
          updatedRmNotes
        );
        this.toastrService.error(error?.message);
      }
    });
  }
  handleCancelRmNote(cardData) {
    this.rentManagerNotesApiService.removeRmNote(cardData.id).subscribe({
      next: (res) => {
        const updatedRmNotes = this.widgetRMService.notes.value.map(
          (rmNote) => {
            return res.id === rmNote.id ? res : rmNote;
          }
        );
        this.widgetRMService.setRMWidgetStateByType(
          RMWidgetDataField.RM_NOTES,
          'UPDATE',
          updatedRmNotes
        );
      },
      error: (error) => {
        this.toastrService.error(error?.message);
      }
    });
  }
  handleRemoveRmNote(cardData) {
    this.rentManagerNotesApiService.removeRmNote(cardData.id).subscribe({
      next: (res) => {
        const updatedRmNotes = this.widgetRMService.notes.value?.filter(
          (rmNote) => {
            return rmNote.id !== cardData.id;
          }
        );
        this.widgetRMService.setRMWidgetStateByType(
          RMWidgetDataField.RM_NOTES,
          'REMOVE',
          updatedRmNotes
        );
      },
      error: (error) => {
        this.toastrService.error(error?.message);
      }
    });
  }
  subscribeSocketUpdateStatusWidget() {
    this.rxWebsocketService.onSocketServiceNote
      .pipe(
        takeUntil(this.destroy),
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        filter((res) => {
          return (
            res &&
            res.data &&
            res.data.taskId === this.taskService.currentTaskId$.value
          );
        })
      )
      .subscribe((res) => {
        this.widgetRMService.setRMWidgetStateByType(
          RMWidgetDataField.RM_NOTES,
          'UPDATE',
          this.widgetRMService.notes.value.map((rmNote) => {
            if (rmNote.id === res.data.id) {
              res.data['syncState'] = 'UPDATE';
              return res.data;
            }
            return rmNote;
          })
        );

        if (res.data.syncStatus === ESyncStatus.FAILED && res.data?.error) {
          this.toastService.error(res.data?.error);
        }
        const trudiResponeTemplate =
          this.trudiService.getTrudiResponse?.getValue();
        if (
          trudiResponeTemplate.isTemplate &&
          res?.data?.syncStatus === ESyncStatus.COMPLETED &&
          res.data?.stepId
        ) {
          this.updateButton(
            res.data?.stepId,
            res?.data?.taskId,
            TrudiButtonEnumStatus.COMPLETED,
            ECRMSystem.RENT_MANAGER,
            ERentManagerType.NOTES
          );
        }
      });
  }

  updateButton(id, taskId, status, stepType, componentType) {
    this.stepService
      .updateStep(taskId, id, null, status, stepType, componentType)
      .subscribe((data) => {
        this.stepService.updateTrudiResponse(data, EActionType.UPDATE_RM);
        this.stepService.setChangeBtnStatusFromRMWidget(false);
      });
  }
}
