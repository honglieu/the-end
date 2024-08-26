import { TaskService } from '@services/task.service';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { EActionType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { ApiStatusService, EApiNames } from '@services/api-status.service';
import { EButtonStepKey, EButtonType } from '@trudi-ui';

import { getStepInDecision } from '@/app/task-detail/modules/steps/utils/functions';

@Component({
  selector: 'trudi-decision',
  templateUrl: './trudi-decision.component.html',
  styleUrls: ['./trudi-decision.component.scss']
})
export class TrudiDecisionComponent implements OnInit, OnChanges, OnDestroy {
  @Input() decisions = [];
  @Input() decisionIndex: number;
  @Input() parentDecisionKey;
  @Input() steps = [];
  public isDecisionLoading = false;
  private destroy$ = new Subject<boolean>();

  public isShowListDecision: boolean = false;
  public decisionChecked: string;
  public currentDecision = null;
  private currentTaskId: string = null;
  private trudiResponse;
  public buttonType = EButtonType.STEP;
  public buttonKey = EButtonStepKey.DECISION;
  public decisionSteps = [];
  public dropdownPositionn = 'down';

  constructor(
    private stepService: StepService,
    private taskService: TaskService,
    private toastService: ToastrService,
    private apiStatusService: ApiStatusService
  ) {}

  ngOnInit(): void {
    this.taskService.currentTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((task) => {
        this.currentTaskId = task.id;
      });

    this.stepService.getTrudiResponse
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.trudiResponse = res;
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    const { decisionIndex } = changes || {};
    this.decisionIndex = decisionIndex?.currentValue ?? this.decisionIndex;
    if (this.parentDecisionKey?.childDecisionKey) {
      this.getCurrentDecision(this.parentDecisionKey?.childDecisionKey, 'id');
      return;
    }
    this.getCurrentDecision(this.decisionIndex, 'index');
  }

  getDropdownDirection(event: Event) {
    const decisionItemHeight = 45;
    const decisionButton = (
      event.currentTarget as HTMLElement
    )?.getBoundingClientRect();
    const viewport = document
      .querySelector('#task-detail-step-panel')
      ?.getBoundingClientRect();
    this.dropdownPositionn =
      decisionButton.bottom + decisionItemHeight * this.decisions.length <
      viewport.bottom
        ? 'down'
        : 'up';
  }

  getCurrentDecision(value: string | number, field: 'id' | 'index') {
    this.currentDecision =
      this.decisions.length === 1
        ? this.decisions[0]
        : this.decisions?.find((decision) => decision[field] === value);
    this.decisionChecked = this.currentDecision?.id;
    this.decisionSteps = getStepInDecision(this.currentDecision);
  }

  handleClick(index: number, id: string) {
    if (this.decisionChecked === id) return;
    this.isShowListDecision = false;
    this.isDecisionLoading = true;
    this.decisionChecked = id;
    this.apiStatusService.setApiStatus(
      EApiNames.PutStepDecisionTaskDetail,
      false
    );
    if (this.parentDecisionKey) {
      this.stepService
        .updateChildDecision(this.currentTaskId, this.parentDecisionKey?.id, id)
        .subscribe({
          next: (res) => {
            if (res) {
              this.stepService.updateTrudiResponse(
                res,
                EActionType.UPDATE_DECISION
              );
            }
            this.isDecisionLoading = false;
          },
          error: (error) => {
            this.toastService.error(error.message ?? 'error');
          }
        });
      return;
    }

    this.stepService
      .updateDecision(index, this.currentTaskId)
      .pipe(
        switchMap((res) => {
          if (res) {
            this.stepService.updateTrudiResponse(
              {
                ...this.trudiResponse,
                decisionIndex: res.decisionIndex
              },
              EActionType.UPDATE_DECISION
            );
            this.isDecisionLoading = false;
          }
          return of({});
        })
      )
      .subscribe({
        next: () => {},
        error: (error) => {
          this.toastService.error(error.message ?? 'error');
        }
      });
  }

  onClickOutSide() {
    this.isShowListDecision = false;
  }

  onClick(event: Event) {
    this.isShowListDecision = !this.isShowListDecision;
    this.getDropdownDirection(event);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
