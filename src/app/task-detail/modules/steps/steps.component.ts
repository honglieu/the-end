import { TrudiPopupStep } from './utils/stepType';
import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  takeUntil
} from 'rxjs';
import { StepDetailMap, StepService } from './services/step.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { EButtonAction } from './utils/property-tree.enum';
import {
  ESelectStepType,
  EStepAction,
  EStepType
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import {
  EPropertyTreeOption,
  EPropertyTreeType
} from '@/app/task-detail/utils/functions';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { EActionType } from './utils/stepType.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { ERentManagerOption } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import { ERentManagerType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { TaskService } from '@/app/services/task.service';
import { isEmpty, isEqual } from 'lodash-es';
import { PreventButtonService, EButtonType } from '@trudi-ui';
import {
  getAllListSteps,
  isCurrentStepMarker,
  mapTaskWorkFlow
} from './utils/functions';
import { RxWebsocketService } from '@/app/services';
import { Store } from '@ngrx/store';
import { taskDetailActions } from '@/app/core/store/task-detail';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { InternalNoteApiService } from '@/app/task-detail/modules/internal-note/services/internal-note-api.service';
import { ActivatedRoute } from '@angular/router';
import { TaskItem } from '@/app/shared/types/task.interface';

@DestroyDecorator
@Component({
  selector: 'steps',
  templateUrl: './steps.component.html',
  styleUrls: ['./steps.component.scss']
})
export class StepsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<boolean>();
  public primarySteps = [];
  public decisions = [];
  public currentDecisionIndex: number = null;
  public decisionSteps = [];
  public actionType = EButtonAction;
  public stepType = EStepType;
  public EStepType = EStepAction;
  public hasTrudiResponse = false;
  public typePropertyTree = EPropertyTreeType;
  public typeRentManager = ERentManagerType;
  public typePopup:
    | EPropertyTreeType
    | EPropertyTreeOption
    | ERentManagerType
    | ERentManagerOption = null;
  public TrudiPopupStep = TrudiPopupStep;
  // only open one popup
  public popupState = {};
  public showIgnoredStep$ = this.stepService.showIgnoredStep$;
  public hasIgnoredStep = false;
  taskId: string = '';
  trudiResponse: any;
  stepDetailMap: StepDetailMap = {};
  showIgnored: boolean = false;
  currentTask: TaskItem;

  constructor(
    private stepService: StepService,
    private widgetPTService: WidgetPTService,
    private widgetRMService: WidgetRMService,
    private taskService: TaskService,
    private preventButtonService: PreventButtonService,
    private websocketService: RxWebsocketService,
    private store: Store,
    private toastCustomService: ToastCustomService,
    private internalNoteApiService: InternalNoteApiService,
    private activatedRoute: ActivatedRoute
  ) {
    // Extract taskId from route parameters to use in fetching internal notes in combination with the current task data
    this.activatedRoute.params.subscribe(
      (params) => (this.taskId = params['taskId'])
    );
  }

  ngOnInit(): void {
    this.subscribePopupState();
    this.subscribePopupUpdateState();
    this.subscribeGetTrudiResponse();
    this.subscribeTaskStepsRealtime();
    this.subscribeUpdateDecision();
    this.handleSocketUnReadComment();
  }

  handleSocketUnReadComment() {
    this.websocketService.onSocketNewUnreadNoteData
      .pipe(
        switchMap(() => {
          return this.internalNoteApiService.getDataInternalNote(this.taskId);
        })
      )
      .subscribe((data) => {
        this.handleGetTaskStep(data);
      });
  }

  subscribeGetTrudiResponse() {
    combineLatest([
      this.taskService.currentTask$,
      this.stepService.getTrudiResponse,
      this.stepService.stepMap,
      this.stepService.showIgnoredStep$,
      this.internalNoteApiService.getDataInternalNote(this.taskId)
    ])
      .pipe(
        filter(([currentTask, trudiResponse]) =>
          Boolean(currentTask && trudiResponse)
        ),
        distinctUntilChanged((prev, curr) => {
          return (
            prev?.[0]?.property?.isTemporary === curr[0].property.isTemporary &&
            isEqual(prev[1], curr[1]) &&
            isEqual(prev[2], curr[2]) &&
            isEqual(prev[3], curr[3])
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(
        ([
          currentTask,
          trudiResponse,
          stepDetailMap,
          showIgnored,
          unreadComments
        ]) => {
          this.trudiResponse = trudiResponse;
          this.stepDetailMap = stepDetailMap;
          this.showIgnored = showIgnored;
          this.currentTask = currentTask;
          this.handleGetTaskStep(unreadComments);
          this.stepService.setUnreadComment(unreadComments);
        }
      );
  }

  handleGetTaskStep(unreadComments) {
    if (!this.trudiResponse) {
      this.resetAll();
      return;
    }
    const isNoPropertyTask = this.currentTask?.property.isTemporary;
    this.checkDisableButton(
      this.trudiResponse,
      isNoPropertyTask,
      this.stepDetailMap
    );
    this.hasTrudiResponse = true;
    this.currentDecisionIndex = this.trudiResponse.decisionIndex;
    this.getTaskSteps(
      this.trudiResponse,
      this.stepDetailMap,
      this.showIgnored,
      unreadComments
    );
    this.stepService.updateCaptureLeaseTermData(this.trudiResponse.leaseTerm);
    this.stepService.setDefaultConfirmEssential(
      this.trudiResponse?.prefillData
    );
  }

  getNextStepMarker(trudiResponse, stepDetailMap, showIgnored = true) {
    if (isEmpty(stepDetailMap)) return;
    //to find from end to beginning
    let steps = [
      ...getAllListSteps(trudiResponse.data.steps),
      ...getAllListSteps(
        trudiResponse.data.decisions,
        this.currentDecisionIndex
      )
    ]
      .filter((item) => !item.disabled)
      .map((item, index) => ({ ...item, ...stepDetailMap[item.id], index }));

    this.hasIgnoredStep = !!steps.find((step) => step.isIgnored);
    if (!this.hasIgnoredStep) this.stepService.showIgnoredStepBS.next(false);

    steps = showIgnored ? steps : steps.filter((item) => !item.isIgnored);

    const isAllStepCompleted = steps.every((step) =>
      isCurrentStepMarker(step.status)
    );
    //if all step is completed or executed then no next marker
    if (isAllStepCompleted) return null;

    const lastTimeUserCompletedStepIndex =
      steps
        .filter(
          (step) => !!step.lastTimeAction && isCurrentStepMarker(step.status)
        )
        .sort(
          (a, b) =>
            new Date(b.lastTimeAction).getTime() -
            new Date(a.lastTimeAction).getTime()
        )[0]?.index ?? -1;

    //if no step is uncompleted or unexecuted then the first step is next marker
    if (lastTimeUserCompletedStepIndex < 0) {
      return steps[0].stepId;
    }
    let position = lastTimeUserCompletedStepIndex + 1;
    //loop until a step is uncompleted or unexecuted if last step is completed or executed
    while (true) {
      if (position > steps.length - 1) {
        position = 0;
      }
      if (!isCurrentStepMarker(steps[position].status)) {
        return steps[position].stepId;
      }
      position = position + 1;
    }
  }

  getTaskSteps(
    trudiResponse,
    stepDetailMap,
    showIgnored = true,
    unreadComments
  ) {
    const nextStepMarkerId = this.getNextStepMarker(
      trudiResponse,
      stepDetailMap,
      showIgnored
    );

    Object.values(stepDetailMap)?.forEach(
      (step) => delete step['isNextStepMarker']
    );
    if (stepDetailMap[nextStepMarkerId]) {
      stepDetailMap[nextStepMarkerId].isNextStepMarker = true;
    }
    const { decisions, primarySteps } = mapTaskWorkFlow(
      trudiResponse,
      stepDetailMap,
      showIgnored,
      unreadComments
    );
    this.decisions = decisions;
    this.primarySteps = primarySteps.filter(
      (step) => step.stepType !== EStepType.RENT_MANAGER
    );
  }

  handleCloseModal() {
    this.widgetPTService.setPopupWidgetState(null);
    this.widgetRMService.setPopupWidgetState(null);
    this.typePopup = null;
  }

  subscribePopupUpdateState() {
    combineLatest([
      this.widgetPTService.getPopupWidgetState(),
      this.widgetRMService.getPopupWidgetState()
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([pt, rm]) => {
        if (!(pt || rm)) {
          this.stepService.setCurrentPTStep(null);
        } else {
          this.typePopup = pt || rm;
        }
      });
  }

  subscribePopupState() {
    this.stepService
      .getPopupState()
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.popupState = state ?? {};
      });
  }

  subscribeTaskStepsRealtime() {
    this.websocketService.onSocketUpdateTaskStep
      .pipe(
        debounceTime(100),
        filter(
          (data) => data.taskId === this.taskService.currentTask$.value.id
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((rs) => {
        this.store.dispatch(
          taskDetailActions.getListSteps({
            taskId: this.taskService.currentTask$.value.id
          })
        );
      });
  }

  subscribeUpdateDecision() {
    this.websocketService.onSocketUpdateDecision
      .pipe(debounceTime(300))
      .pipe(
        filter(
          (data) => data.taskId === this.taskService.currentTask$.value.id
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.toastCustomService
          .handleShowToastReloadWorkflow(data)
          .onAction.subscribe((rs) => {
            this.taskService.reloadTaskDetail.next(true);
          });
      });
  }

  ngOnDestroy(): void {
    this.stepService.updateTrudiResponse(null, EActionType.SET_NULL);
    this.stepService.setChangeBtnStatusFromPTWidget(false);
    this.stepService.showIgnoredStepBS.next(false);
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  resetAll() {
    this.hasTrudiResponse = false;
    this.decisions = [];
    this.primarySteps = [];
    this.decisionSteps = [];
    this.stepService.setChangeBtnStatusFromPTWidget(false);
  }

  checkDisableButton(trudiResponse, isNoPropertyTask: boolean, stepDetailMap) {
    const buttons = this.stepService.getButton(trudiResponse);

    const firstRequiredStepIndex = buttons.findIndex(
      (btn) =>
        btn.isRequired &&
        stepDetailMap[btn.id]?.status === TrudiButtonEnumStatus.PENDING
    );
    const firstRequiredStepNotFoundOrLatest =
      firstRequiredStepIndex === -1 ||
      firstRequiredStepIndex === buttons.length - 1;

    buttons.forEach((step, stepIndex: number) => {
      const isStepEnabledForNoPropertyTask =
        [ESelectStepType.CHECK_LIST, ESelectStepType.NEW_TASK].includes(
          step.stepType
        ) ||
        (step.stepType === ESelectStepType.COMMUNICATION_STEP &&
          [EStepAction.SEND_BASIC_EMAIL, EStepAction.SEND_REQUEST].includes(
            step.action
          ));

      const disabledByRequiredStep =
        !firstRequiredStepNotFoundOrLatest &&
        stepIndex > firstRequiredStepIndex;

      step.showNoPropertyWarning =
        !isStepEnabledForNoPropertyTask &&
        !disabledByRequiredStep &&
        isNoPropertyTask;

      step.disabled = disabledByRequiredStep || step.showNoPropertyWarning;
    });
  }

  handleClosePopup() {
    if (
      this.popupState &&
      this.popupState['type'] === TrudiPopupStep.CONFIRM_ESSENTIAL
    ) {
      this.preventButtonService.deleteProcess(
        this.popupState['options']?.['buttonKey'],
        EButtonType.STEP
      );
    }
    this.popupState = {};
    this.stepService.setPopupState(null, null);
  }

  handleEyeButton() {
    this.stepService.toggleShowIgnoredStep();
    //Todo filter ignored steps.
  }
}
