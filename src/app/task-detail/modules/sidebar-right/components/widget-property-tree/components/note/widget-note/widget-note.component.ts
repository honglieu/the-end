import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PropertiesService } from '@services/properties.service';
import { AgencyService } from '@services/agency.service';
import { WidgetNoteService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-note.service';
import { PtNote } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/note/sync-note-popup/note-sync.interface';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TrudiService } from '@services/trudi.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { TaskService } from '@services/task.service';
import { EButtonStepKey, EButtonType, EButtonWidget } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
@Component({
  selector: 'widget-note',
  templateUrl: './widget-note.component.html',
  styleUrls: ['./widget-note.component.scss']
})
export class WidgetNoteComponent implements OnInit, OnDestroy {
  @Input() note: PtNote;
  @Output() onHandleEdit = new EventEmitter<boolean>();
  private unSubscribe = new Subject<void>();
  public listNote: PtNote[] = [];
  public isSync: boolean = false;
  public syncStatus: ESyncStatus;
  readonly EButtonType = EButtonType;
  readonly EButtonWidget = EButtonWidget;
  readonly EButtonStepKey = EButtonStepKey;

  constructor(
    private propertyService: PropertiesService,
    private widgetNoteService: WidgetNoteService,
    private agencyService: AgencyService,
    private widgetPTService: WidgetPTService,
    public stepService: StepService,
    public trudiService: TrudiService,
    public taskService: TaskService,
    public trudiDynamicParamater: TrudiDynamicParameterService,
    public preventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    this.widgetPTService
      .getPTWidgetStateByType<PtNote[]>(PTWidgetDataField.NOTES)
      .subscribe((res) => {
        if (res) {
          this.listNote = res;
        }
      });
  }

  handleEditNote(item) {
    this.widgetNoteService.isEditNote.next(true);
    this.widgetNoteService.updateWidgetNoteResponseData(item);
  }

  confirmCancel(noteItemId) {
    this.widgetNoteService
      .deleteWidgetNote(noteItemId)
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((res) => {
        this.widgetNoteService.updateListWidgetNote(res, noteItemId);
      });
  }

  handleRetryNote(data) {
    this.widgetNoteService.updateListWidgetNote(
      {
        ...data,
        syncStatus: ESyncStatus.INPROGRESS
      },
      data.id
    );
    this.widgetNoteService
      .retryWidgetNote(
        data.id,
        this.propertyService.currentPropertyId.value,
        data?.stepId,
        this.taskService.currentTask$.value?.agencyId
      )
      .pipe(takeUntil(this.unSubscribe))
      .subscribe({
        next: (res) => {
          if (res && res?.syncStatus === ESyncStatus.COMPLETED) {
            const trudiResponeTemplate =
              this.trudiService.getTrudiResponse?.getValue();
            if (trudiResponeTemplate?.isTemplate) {
              this.stepService.updateButtonStatusTemplate(
                res?.stepId,
                EPropertyTreeButtonComponent.NOTE,
                EButtonAction.PT_NEW_COMPONENT
              );
            }
          }
          this.widgetNoteService.updateListWidgetNote(res, data.id);
        }
      });
  }

  trackById(_index: number, item: PtNote) {
    return item.id;
  }

  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
