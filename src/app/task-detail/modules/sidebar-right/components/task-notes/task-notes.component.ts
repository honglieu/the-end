import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { IngoingInspectionService } from '@services/ingoing-inspection.service';
import { LoadingService } from '@services/loading.service';
import { MaintenanceNoteService } from '@services/maintenance-note.service';
import { RoutineInspectionService } from '@services/routine-inspection.service';
import { TaskService } from '@services/task.service';
import {
  EntityTypeNote,
  InspectionTypes,
  TaskNameId,
  TaskType,
  TaskTypeNote
} from '@shared/enum/task.enum';
import { ETrudiType } from '@shared/enum/trudi';
import {
  MaintenanceNote,
  TypeNote
} from '@shared/types/conversation.interface';
import { AppointmentCard } from '@shared/types/trudi.interface';

@Component({
  selector: 'task-notes',
  templateUrl: './task-notes.component.html',
  styleUrls: ['./task-notes.component.scss']
})
export class TaskNotesComponent implements OnInit, OnDestroy {
  public taskId: string;
  private unsubscribe = new Subject<void>();
  public appointmentCardArea: AppointmentCard[] = [];
  public TaskTypeNote = TaskTypeNote;
  public taskType?: TaskType;
  public trudiType: ETrudiType;
  public dataNote = {} as TypeNote;
  public isExpandMaintenanceNotes: boolean = false;
  public paragraph: object = { rows: 0 };

  constructor(
    private ingoingInspectionService: IngoingInspectionService,
    private routineInspectionService: RoutineInspectionService,
    private maintenanceNoteService: MaintenanceNoteService,
    public taskService: TaskService,
    public loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadingService.onLoading();
    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((task) => {
        this.taskId = task.id;
        const taskTypeId = task?.trudiResponse?.setting?.['taskNameId'];
        switch (taskTypeId) {
          case TaskNameId.tenantVacate:
          case TaskNameId.routineInspection:
            this.subscribeTaskNoteResponse(task, EntityTypeNote.inspection);
            break;
          case TaskNameId.routineMaintenance:
            this.subscribeTaskNoteResponse(task, EntityTypeNote.property);
            break;
          default:
            break;
        }
        this.isExpandMaintenanceNotes = false;
      });
  }

  markNoteAsRead() {
    let entityType = EntityTypeNote.inspection;
    let noteType = 'general';
    if (this.dataNote.type === TaskTypeNote.maintenance) {
      entityType = EntityTypeNote.property;
      noteType = 'maintenance';
    }
    const body = {
      taskId: this.taskId,
      entityId: this.dataNote.entityId,
      entityType,
      noteType
    };
  }

  //now this function only use for maintenance note and general outgoing inspection note
  getNoteByTaskId(taskId: string, entityType: EntityTypeNote) {
    this.dataNote = null;
    this.taskService.getNoteByTaskId(taskId, entityType).subscribe((res) => {
      if (res) {
        let dataNoteType;
        switch (entityType) {
          case EntityTypeNote.property:
            dataNoteType = TaskTypeNote.maintenance;
            break;
          case EntityTypeNote.inspection:
            switch (res?.type) {
              case InspectionTypes.INGOING_INSPECTION:
                dataNoteType = TaskTypeNote.ingoingInspection;
                break;
              case InspectionTypes.ROUTINE_INSPECTION:
                dataNoteType = TaskTypeNote.routineInspection;
                break;
              case InspectionTypes.OUTGOING_INSPECTION:
                dataNoteType = TaskTypeNote.outgoingInspection;
                break;
              default:
                break;
            }
            break;
          default:
            break;
        }
        this.dataNote = {
          type: dataNoteType,
          note: res?.note,
          expenditureLimit: res?.expenditureLimit,
          isRead: res?.isRead,
          entityId: res.entityId
        };
        this.loadingService.stopLoading();
        if (entityType === EntityTypeNote.property) {
          this.maintenanceNoteService.setMaintenanceNote(
            res as MaintenanceNote
          );
        }
      }
    });
  }

  handleCollapseNotes() {
    if (!this.dataNote.isRead) {
      this.markNoteAsRead();
    }
  }

  subscribeTaskNoteResponse(task, entityType: EntityTypeNote) {
    if (task && task.id === this.taskId) {
      this.getNoteByTaskId(this.taskId, entityType);
    }
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.maintenanceNoteService.setMaintenanceNote(null);
  }
}
