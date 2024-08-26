import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import {
  BodySyncNote,
  BodyUpdateSyncNote,
  PtNote
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/note/sync-note-popup/note-sync.interface';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { WidgetPTService } from './widget-property.service';
import { TaskNameId } from '@shared/enum/task.enum';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import uuid4 from 'uuid4';
import { TaskService } from '@services/task.service';
import { TenantLandlordRequestService } from '@services/tenant-landlord-request.service';
import {
  BreachNoticeTrudiResponse,
  TrudiResponse
} from '@shared/types/trudi.interface';
import { TrudiService } from '@services/trudi.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';

@Injectable({
  providedIn: 'root'
})
export class WidgetNoteService {
  public widgetNoteRequestResponse: BehaviorSubject<PtNote> =
    new BehaviorSubject(null);
  public widgetNoteFloatingDisplayStatus$: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public setOpenModal$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public reloadList$ = new BehaviorSubject<void>(null);
  public reloadSyncStatus = false;
  public isEditNote: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public isEditNote$ = this.isEditNote.asObservable();

  constructor(
    private apiService: ApiService,
    private widgetPTService: WidgetPTService,
    private tenantLandlordService: TenantLandlordRequestService,
    private taskService: TaskService,
    private stepService: StepService,
    public trudiService: TrudiService<TrudiResponse | BreachNoticeTrudiResponse>
  ) {}

  updateWidgetNoteResponseData(data: PtNote) {
    this.widgetNoteRequestResponse.next(data);
  }

  updateListWidgetNote(data: PtNote, id: string) {
    const prevData = this.widgetPTService.notes.getValue();
    if (data) {
      let newData = [
        ...prevData.map((e) => {
          if (e.firstTimeSyncSuccess && e.id !== id) {
            return { ...e, firstTimeSyncSuccess: false };
          }
          return e;
        })
      ];
      const index = newData.findIndex((note) => note.id === id);
      if (index > -1) {
        newData[index] = { ...data };
      } else {
        newData = [data, ...newData];
      }
      this.widgetPTService.setPTWidgetStateByType(
        PTWidgetDataField.NOTES,
        'UPDATE',
        newData
      );
      return;
    }
    let newData = [
      ...prevData
        .filter((value) => value.id !== id)
        .map((e) => {
          if (e.firstTimeSyncSuccess) {
            return { ...e, firstTimeSyncSuccess: false };
          }
          return e;
        })
    ];
    this.widgetPTService.setPTWidgetStateByType(
      PTWidgetDataField.NOTES,
      'REMOVE',
      newData
    );
  }

  getDataUpdateModalResponse() {
    return this.setOpenModal$.asObservable();
  }

  setDataUpdateModalResponse(data: boolean) {
    this.setOpenModal$.next(data);
  }

  createSyncNoteToProperty(body: BodySyncNote) {
    const {
      agencyId,
      taskId,
      description,
      propertyId,
      categoryId,
      ptNoteEntityType,
      idUserPropertyGroup,
      ptId,
      stepId
    } = body;
    return this.apiService.postAPI(conversations, 'widget/note/sync-to-pt', {
      agencyId,
      taskId,
      description,
      propertyId,
      categoryId,
      ptNoteEntityType,
      idUserPropertyGroup: idUserPropertyGroup || null,
      ptId: ptId || null,
      stepId
    });
  }

  updateSyncNoteToProperty(
    body: BodyUpdateSyncNote,
    isFromUpdateButton: boolean = false
  ) {
    const {
      id,
      description,
      propertyId,
      categoryId,
      ptNoteEntityType,
      stepId,
      agencyId,
      taskId
    } = body;
    return this.apiService.putAPI(conversations, 'widget/note', {
      id,
      description,
      propertyId,
      categoryId,
      ptNoteEntityType,
      isFromUpdateButton,
      stepId,
      agencyId,
      taskId
    });
  }

  handleCreateNote(syncRequest) {
    const id = uuid4();
    const currentStep = this.stepService.currentPTStep.getValue();
    this.updateListWidgetNote(
      {
        ...syncRequest,
        id,
        createdAt: new Date(),
        syncStatus: ESyncStatus.INPROGRESS,
        nameUserPropertyGroup: syncRequest.nameUserPropertyGroup,
        categoryName: syncRequest.categoryName,
        entityType: syncRequest.entityType,
        stepId: currentStep?.id ?? null
      },
      id
    );
    this.createSyncNoteToProperty(syncRequest).subscribe({
      next: (res) => {
        if (this.widgetNoteRequestResponse?.value?.id === id) {
          this.updateWidgetNoteResponseData({
            ...this.widgetNoteRequestResponse?.value,
            syncStatus: res.syncStatus,
            firstTimeSyncSuccess: res.syncStatus !== ESyncStatus.FAILED,
            lastModified: res.lastModified
          });
        }
        this.updateListWidgetNote(
          {
            ...res,
            firstTimeSyncSuccess: res.syncStatus !== ESyncStatus.FAILED,
            nameUserPropertyGroup: syncRequest.nameUserPropertyGroup,
            categoryName: syncRequest.categoryName
          },
          id
        );
        const taskNameId =
          this.taskService.currentTask$.value?.trudiResponse?.setting
            ?.taskNameId;
        const trudiResponeTemplate =
          this.trudiService.getTrudiResponse?.getValue();
        if (
          (trudiResponeTemplate as TrudiResponse)?.isTemplate &&
          res.syncStatus !== ESyncStatus.FAILED
        ) {
          this.stepService.updateButtonStatusTemplate(
            res?.stepId,
            EPropertyTreeButtonComponent.NOTE,
            EButtonAction.PT_NEW_COMPONENT,
            res?.id
          );
        } else {
          switch (taskNameId) {
            case TaskNameId.requestTenant:
            case TaskNameId.requestLandlord:
              const trudiBtnResponse =
                this.tenantLandlordService.tenantLandlordRequestResponse.getValue();
              if (res.syncStatus !== ESyncStatus.FAILED) {
                trudiBtnResponse.data[0].body.decisions.forEach((decision) => {
                  decision.button.forEach((button) => {
                    if (button.action.includes('add_note_to_pt')) {
                      button.isCompleted = true;
                      button.status = TrudiButtonEnumStatus.COMPLETED;
                    }
                  });
                });
              }
              break;
            case TaskNameId.breachNotice:
              const breachNoticeResponse =
                this.trudiService.getTrudiResponse.getValue();
              if (
                res.syncStatus !== ESyncStatus.FAILED &&
                breachNoticeResponse?.data?.[0]?.body?.breachNoticeSteps?.[1]
                  ?.button?.[2].isCompleted === false
              ) {
                breachNoticeResponse.data[0].body.breachNoticeSteps[1].button[2].isCompleted =
                  true;
                breachNoticeResponse.data[0].body.breachNoticeSteps[1].button[2].status =
                  TrudiButtonEnumStatus.COMPLETED;
              }
              break;
            default:
              break;
          }
        }
      },
      error: () => {
        if (this.widgetNoteRequestResponse?.value?.id === id) {
          this.updateWidgetNoteResponseData({
            ...this.widgetNoteRequestResponse?.value,
            syncStatus: ESyncStatus.FAILED
          });
        }
      }
    });
  }

  handleEditNote(syncRequest, id, isFromUpdateButton: boolean = false) {
    this.updateSyncNoteToProperty(syncRequest, isFromUpdateButton).subscribe({
      next: (res) => {
        if (this.widgetNoteRequestResponse?.value?.id === id) {
          this.updateWidgetNoteResponseData({
            ...this.widgetNoteRequestResponse?.value,
            syncStatus: res.syncStatus,
            firstTimeSyncSuccess: res.syncStatus !== ESyncStatus.FAILED,
            lastModified: res.lastModified
          });
        }
        this.updateListWidgetNote(
          {
            ...res,
            entityType: res.entityType,
            firstTimeSyncSuccess: res.syncStatus !== ESyncStatus.FAILED,
            nameUserPropertyGroup: syncRequest.tenancyName,
            categoryName: syncRequest.categoryName
          },
          this.widgetNoteRequestResponse.value.id
        );
        const trudiBtnResponse = this.trudiService.getTrudiResponse.getValue();
        const taskNameId =
          this.taskService.currentTask$.value?.trudiResponse?.setting
            ?.taskNameId;
        const trudiResponeTemplate =
          this.trudiService.getTrudiResponse?.getValue();
        if (
          (trudiResponeTemplate as TrudiResponse)?.isTemplate &&
          res.syncStatus !== ESyncStatus.FAILED
        ) {
          this.stepService.updateButtonStatusTemplate(
            res?.stepId,
            EPropertyTreeButtonComponent.NOTE,
            EButtonAction.PT_UPDATE_COMPONENT,
            res?.id
          );
        }
        if (
          isFromUpdateButton &&
          taskNameId === TaskNameId.breachNotice &&
          res.syncStatus !== ESyncStatus.FAILED &&
          trudiBtnResponse?.data?.[0]?.body?.breachNoticeSteps?.[2]?.button?.[2]
            .isCompleted === false
        ) {
          trudiBtnResponse.data[0].body.breachNoticeSteps[2].button[2].isCompleted =
            true;
          trudiBtnResponse.data[0].body.breachNoticeSteps[2].button[2].status =
            TrudiButtonEnumStatus.COMPLETED;
        }
        this.reloadList$.next();
      },
      error: () => {
        if (this.widgetNoteRequestResponse?.value?.id === id) {
          this.updateWidgetNoteResponseData({
            ...this.widgetNoteRequestResponse?.value,
            syncStatus: ESyncStatus.FAILED
          });
        }
      }
    });
  }

  getNotesByTaskId(taskId: string): Observable<PtNote[]> {
    return this.apiService.getAPI(
      conversations,
      `widget/notes/getByTaskId/${taskId}`
    );
  }

  getNoteExisting(taskId: string): Observable<PtNote[]> {
    return this.apiService.getAPI(
      conversations,
      `widget/note/get-list-existing?taskId=${taskId}`
    );
  }

  getListPropertyNote(propertyId: string) {
    return this.apiService.getAPI(
      conversations,
      `widget/note/get-property-note?propertyId=${propertyId}`
    );
  }

  retryWidgetNote(
    noteId: string,
    propertyId: string,
    stepId: string,
    agencyId: string
  ) {
    return this.apiService.postAPI(conversations, 'widget/note/retry', {
      noteId,
      propertyId,
      stepId,
      agencyId
    });
  }

  deleteWidgetNote(noteId: string) {
    return this.apiService.deleteAPI(conversations, `widget/note/${noteId}`);
  }
}
