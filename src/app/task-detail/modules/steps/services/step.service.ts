import { Injectable, Injector } from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { BehaviorSubject, Observable, Subject, finalize, map } from 'rxjs';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import {
  ECalendarEvent,
  EStepAction,
  EStepType
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { ApiService } from '@services/api.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import {
  TrudiResponse,
  TrudiResponseType,
  ICaptureLeaseTermResponse
} from '@shared/types/trudi.interface';
import {
  DynamicParameterGroups,
  DynamicParameterType
} from '@/app/trudi-send-msg/utils/dynamic-parameter';
import { conversations } from 'src/environments/environment';
import {
  BASE_PARAMETER_WIDGET,
  PT_PARAMETER_WIDGET,
  RM_PARAMETER_WIDGET
} from '@/app/task-detail/modules/steps/constants/widget.constants';
import {
  IDefaultConfirmEssential,
  ISummaryContent,
  IConfirmEssential
} from '@/app/task-detail/modules/steps/utils/communicationType';
import {
  EButtonAction,
  EPropertyTreeButtonComponent,
  ERentManagerAction,
  ERentManagerButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { IUpdateStatus } from '@/app/task-detail/modules/steps/utils/property-tree.interface';
import {
  IListFileFromDynamic,
  IStepTypeIdPayload,
  StepDetail,
  TrudiPopupStep,
  TrudiPopupStepData,
  TrudiStep
} from '@/app/task-detail/modules/steps/utils/stepType';
import { CompanyService } from '@services/company.service';
import {
  REGEX_VARIABLE,
  REGEX_VARIABLE_OLD_CONFIG
} from '@/app/task-detail/modules/steps/utils/communication.enum';
import { ButtonKey, EButtonStepKey } from '@trudi-ui';
import { ECtaOption } from '@/app/task-detail/modules/steps/components/cta-buttons/cta-buttons.component';
@Injectable({
  providedIn: 'root'
})
export class StepService<T extends TrudiResponseType = TrudiResponse> {
  private trudiResponse$ = new BehaviorSubject<T | any>(null);
  public currentPTStep = new BehaviorSubject<TrudiStep>(null);
  public currentRMStep = new BehaviorSubject<TrudiStep>(null);
  public currentCommunicationStep = new BehaviorSubject<TrudiStep>(null);
  private summaryContent = new BehaviorSubject<ISummaryContent>(null);
  public isUpdateBtnFromPTWidget$ = new BehaviorSubject<boolean>(false);
  public isUpdateBtnFromRMWidget$ = new BehaviorSubject<boolean>(false);
  public updateStatus: BehaviorSubject<IUpdateStatus> = new BehaviorSubject(
    null
  );
  public socketStep = null;
  private modelDataPT = new BehaviorSubject<TrudiStep>(null);
  private popupState: Subject<TrudiPopupStepData> = new Subject();
  public confirmEssential: BehaviorSubject<IConfirmEssential> =
    new BehaviorSubject(null);
  private captureLeaseTermData: BehaviorSubject<ICaptureLeaseTermResponse> =
    new BehaviorSubject(null);
  public captureLeaseTermData$ = this.captureLeaseTermData.asObservable();
  private eventStep = new BehaviorSubject<boolean>(false);
  private typeCrm: ECRMSystem;
  private listOfFileDynamicParameter =
    new BehaviorSubject<IListFileFromDynamic>(null);
  public listOfFileFromDynamic$ =
    this.listOfFileDynamicParameter.asObservable();
  private defaultConfirmEssential: BehaviorSubject<IDefaultConfirmEssential> =
    new BehaviorSubject(null);
  public ctaButtonOption$: Subject<ICtaButtonPayload> = new Subject();
  private currentStepBS: BehaviorSubject<ICurrentStepPayload> =
    new BehaviorSubject(null);
  public currentStep$ = this.currentStepBS.asObservable();
  public disableTriggerDetailPanel$ = new BehaviorSubject(false);
  private showStepDetailPanel$ = new BehaviorSubject(false);
  public showStepDetailPanelBS = this.showStepDetailPanel$.asObservable();
  public isExecutingStepBS = new BehaviorSubject(false);
  public isExecutingStep$ = this.isExecutingStepBS.asObservable();
  private listTaskStepsBS = new BehaviorSubject<unknown>([]);
  public listTaskSteps$ = this.listTaskStepsBS.asObservable();
  public stepMap = new BehaviorSubject<StepDetailMap>({});
  public showIgnoredStepBS = new BehaviorSubject<boolean>(false);
  public showIgnoredStep$ = this.showIgnoredStepBS.asObservable();

  private collapseSummaryBS = new BehaviorSubject<boolean>(false);
  public collapseSummary$ = this.collapseSummaryBS.asObservable();

  private isReadCommentInStep = new BehaviorSubject<string>('');
  public isReadCommentInStep$ = this.isReadCommentInStep.asObservable();

  private unreadComments = new BehaviorSubject(null);
  public unreadComments$ = this.unreadComments.asObservable();

  constructor(
    public injector: Injector,
    private apiService: ApiService,
    private companyService: CompanyService
  ) {
    this.companyService.currentCompanyCRMSystemName.subscribe((value) => {
      this.typeCrm = value;
    });
  }

  setUnreadComment(data) {
    this.unreadComments.next(data);
  }

  get listOfFileDynamicValue() {
    return this.listOfFileDynamicParameter.value;
  }

  getDefaultConfirmEssential() {
    return this.defaultConfirmEssential.asObservable();
  }

  setDefaultConfirmEssential(value: IDefaultConfirmEssential) {
    this.defaultConfirmEssential.next(value);
  }

  setIsReadComments(value) {
    this.isReadCommentInStep.next(value);
  }

  setCollapseSummary(value: boolean) {
    this.collapseSummaryBS.next(value);
  }

  hasEssentialParams(
    isEnableSettingAI: boolean = false,
    options: IEssentialParamOption = {
      ignoreProperties: [],
      buttonKey: null,
      isCompletedStep: false,
      isHasPrefillData: false
    }
  ): boolean {
    const currentStep = this.currentCommunicationStep?.value;
    if (!currentStep) return false;
    if (!options.ignoreProperties) options.ignoreProperties = [];
    let parameterGroups;
    switch (this.typeCrm) {
      case ECRMSystem.PROPERTY_TREE:
        parameterGroups = cloneDeep(PT_PARAMETER_WIDGET);
        break;
      case ECRMSystem.RENT_MANAGER:
        parameterGroups = cloneDeep(RM_PARAMETER_WIDGET);
        break;
      default:
        parameterGroups = cloneDeep(BASE_PARAMETER_WIDGET);
        break;
    }

    // AI Generate enable
    if (isEnableSettingAI && currentStep.fields?.isAIGenerated) {
      options.ignoreProperties.push(DynamicParameterType.TENANCY);
      for (const key in parameterGroups) {
        parameterGroups[key] = true;
        if (options.ignoreProperties.includes(key)) {
          parameterGroups[key] = false;
        }
      }
      this.updateParameterGroupSchedule(
        parameterGroups,
        currentStep,
        options.buttonKey
      );
      this.setPopupState(TrudiPopupStep.CONFIRM_ESSENTIAL, parameterGroups);
      return true;
    }

    // AI Generate disable
    let msg = currentStep.fields?.msgBody;
    if (!msg) return false;
    msg = msg.replace(/'/g, '"');
    const regex = REGEX_VARIABLE;
    let match = null;
    while (
      (match = regex.exec(msg)) !== null ||
      (match = REGEX_VARIABLE_OLD_CONFIG.exec(msg)) !== null
    ) {
      const param = match[1];
      for (const [parameterType, _] of Object.entries(parameterGroups)) {
        if (
          currentStep.action !== EStepAction.SCHEDULE_REMINDER &&
          currentStep.action !== EStepAction.SEND_CALENDAR_EVENT &&
          options.ignoreProperties.includes(parameterType)
        ) {
          continue;
        }
        const parameters = DynamicParameterGroups.get(parameterType);
        if (parameters && parameters.includes(param)) {
          parameterGroups[parameterType] = true;
          break;
        }
      }
    }

    if (
      match === null &&
      !options.isCompletedStep &&
      !options.isHasPrefillData &&
      options.buttonKey === EButtonStepKey.CAPTURE_LEASE_TERMS
    ) {
      parameterGroups[DynamicParameterType.TENANCY] = true;
    }

    this.updateParameterGroupSchedule(
      parameterGroups,
      currentStep,
      options.buttonKey
    );
    if (Object.values(parameterGroups).every((value) => value === false)) {
      return false;
    }
    this.setPopupState(TrudiPopupStep.CONFIRM_ESSENTIAL, parameterGroups);
    return true;
  }

  updateParameterGroupSchedule(parameterGroups, currentStep, buttonKey): void {
    const { action, fields } = currentStep;
    parameterGroups['buttonKey'] = buttonKey;

    if (
      ![
        EStepAction.SCHEDULE_REMINDER,
        EStepAction.SEND_CALENDAR_EVENT
      ].includes(action)
    ) {
      return;
    }

    const paramUpdates = [
      {
        key: DynamicParameterType.CALENDAR_EVENT_BREACH_REMEDY_DATE,
        eventName: ECalendarEvent.BREACH_NOTICE_REMEDY_DATE
      },
      {
        key: DynamicParameterType.CALENDAR_EVENT_ENTRY_NOTICE,
        eventName: ECalendarEvent.ENTRY_NOTICE_ENTRY_DATE
      },
      {
        key: DynamicParameterType.CALENDAR_EVENT_CUSTOM,
        eventName: ECalendarEvent.CUSTOM_EVENT
      }
    ];

    paramUpdates
      .filter(
        ({ key, eventName }) =>
          parameterGroups[key] && fields.customControl.event === eventName
      )
      .forEach(({ key }) => {
        parameterGroups[key] = false;
      });
  }

  updateCaptureLeaseTermData(data: ICaptureLeaseTermResponse) {
    this.captureLeaseTermData.next(data);
  }

  getPopupState() {
    return this.popupState.asObservable();
  }

  setPopupState(type: TrudiPopupStep, options) {
    this.popupState.next({
      type,
      options
    });
  }

  getConfirmEssential() {
    return this.confirmEssential.asObservable();
  }

  setConfirmEssential(state, action: string) {
    if (!action) {
      throw 'action not empty';
    }
    if (state) {
      const currentCommunicationStep = this.currentCommunicationStep?.value;
      state.action = currentCommunicationStep?.action;
    }
    this.confirmEssential.next(state);
  }

  setChangeBtnStatusFromPTWidget(isUpdate: boolean) {
    this.isUpdateBtnFromPTWidget$.next(isUpdate);
  }

  setChangeBtnStatusFromRMWidget(isUpdate: boolean) {
    this.isUpdateBtnFromRMWidget$.next(isUpdate);
  }

  setSummaryContent(data: ISummaryContent) {
    this.summaryContent.next(data);
  }

  getSummaryContent() {
    return this.summaryContent.asObservable();
  }

  get getTrudiResponse() {
    return this.trudiResponse$.asObservable();
  }

  setModalDataPT(data: TrudiStep) {
    this.modelDataPT.next(data);
  }

  getModalDataPT() {
    return this.modelDataPT.asObservable();
  }

  updateButtonStatusTemplate(
    id,
    componentType: EPropertyTreeButtonComponent | ERentManagerButtonComponent,
    action: EButtonAction | ERentManagerAction,
    widgetId?
  ) {
    this.updateStatus.next({
      id: id,
      status: TrudiButtonEnumStatus.COMPLETED,
      componentType: componentType,
      action: action,
      widgetId: widgetId
    });
  }

  setCurrentPTStep(step: TrudiStep) {
    this.currentPTStep.next(step);
  }

  get currentPTStep$() {
    return this.currentPTStep;
  }

  setCurrentRMStep(step: TrudiStep) {
    this.currentRMStep.next(step);
  }

  get currentRMStep$() {
    return this.currentRMStep;
  }

  setCurrentCommunicationStep(step: TrudiStep) {
    this.currentCommunicationStep.next(step);
  }

  get currentCommunicationStep$() {
    return this.currentCommunicationStep;
  }

  setListFileDynamic(data) {
    this.listOfFileDynamicParameter.next(data);
  }

  setTrudiResponse<T>(data: T) {
    this.trudiResponse$.next(data);
  }

  updateTrudiResponse(data: T, action: string) {
    // action define to debug
    if (!action) {
      console.error('action not empty');
    }
    this.trudiResponse$.next(data);
  }

  getButtonSteps(steps) {
    return steps.map((step) => (step?.buttons ? step?.buttons : [step])).flat();
  }

  getNestedButtonDecisions(decisionsParent, buttons) {
    if (decisionsParent) {
      const buttonStep = this.getButtonSteps(decisionsParent?.steps || []);
      buttons.push(buttonStep);
      if (decisionsParent?.decisions?.length) {
        decisionsParent?.decisions?.forEach((decisionChild) => {
          this.getNestedButtonDecisions(decisionChild, buttons);
        });
      }
    }
  }

  getButton(trudiResponse) {
    const buttons = [];
    const steps = trudiResponse?.data?.steps;
    const decisions = trudiResponse?.data?.decisions;

    const decisionIndex = trudiResponse?.decisionIndex;
    const btnStep = steps ? this.getButtonSteps(steps) : [];
    buttons.push(btnStep);
    this.getNestedButtonDecisions(
      decisions?.find((decision) => decision.index === decisionIndex),
      buttons
    );

    return buttons
      .flat()
      .filter((button) => ![EStepType.RENT_MANAGER].includes(button.stepType));
  }

  get eventStep$() {
    return this.eventStep;
  }

  setEventStep(data: boolean) {
    this.eventStep.next(data);
  }

  setCtaButtonOption(data: ICtaButtonPayload) {
    this.ctaButtonOption$.next(data);
  }

  setCurrentStep(payload: ICurrentStepPayload) {
    this.currentStepBS.next(payload);
  }

  updateStep(
    taskId: string,
    id?: string,
    action?: string,
    status?: TrudiButtonEnumStatus,
    stepType?: string,
    componentType?: string,
    isManual?: boolean,
    stepTypeId?: IStepTypeIdPayload
  ) {
    this.isExecutingStepBS.next(true);
    return this.apiService
      .postAPI(conversations, `task-management/update-button-status`, {
        id,
        taskId,
        action,
        status,
        stepType,
        componentType,
        isManual,
        ...stepTypeId
      })
      .pipe(
        finalize(() => {
          this.updateStepById(id, {
            status,
            lastTimeAction: new Date().toISOString()
          });
          this.setCtaButtonOption(null);
          this.isExecutingStepBS.next(false);
        })
      );
  }

  updateStepMultipleToTask(
    taskIds: string[],
    id?: string,
    action?: string,
    status?: TrudiButtonEnumStatus,
    stepType?: string
  ) {
    return this.apiService.postAPI(
      conversations,
      `task-management/update-button-status-multiple-task`,
      {
        taskIds,
        id,
        action,
        status,
        stepType
      }
    );
  }

  saveTrudiResponseData(leaseTerm, noticeToLeave, taskId: string) {
    return this.apiService.postAPI(
      conversations,
      'task-management/save-trudi-response-data',
      { taskId, leaseTerm, noticeToLeave }
    );
  }
  updateDecision(decisionIndex: number, taskId: string) {
    return this.apiService.putAPI(
      conversations,
      `task-management/update-decision-tree`,
      {
        decisionIndex: decisionIndex + '',
        taskId
      }
    );
  }

  updateStepById(stepId: string, data: Partial<StepDetail>) {
    const stepMap = cloneDeep(this.stepMap.value);

    if (stepMap[stepId]) {
      let step = {
        ...stepMap[stepId],
        ...data
      };
      stepMap[stepId] = step;
      this.stepMap.next(stepMap);
    }
  }

  updateChildDecision(
    taskId: string,
    decisionId: string,
    childDecisionId: string
  ) {
    return this.apiService.putAPI(
      conversations,
      `tasks/update-child-decision-key`,
      {
        decisionId,
        taskId,
        childDecisionId
      }
    );
  }

  public updateTaskSteps(body: UpdateTaskStepsPayload) {
    return this.apiService.postAPI(
      conversations,
      `task/update-task-steps`,
      body
    );
  }

  public getAllTaskSteps(taskId: string): Observable<StepDetail[]> {
    return this.apiService.getAPI(conversations, `task/get-all-steps`, {
      taskId
    });
  }

  scheduleSendMessage(body) {
    return this.apiService.postAPI(
      conversations,
      'message/schedule-send-message',
      body
    );
  }

  setListTaskSteps(steps: StepDetail[]) {
    this.listTaskStepsBS.next(steps);
    let map = {};
    for (const item of steps) {
      map[item.stepId] = item;
    }
    this.stepMap.next(map);
  }

  public getStepById(stepId: string) {
    return this.stepMap.pipe(map((data) => data[stepId] || null));
  }

  public toggleShowIgnoredStep() {
    this.showIgnoredStepBS.next(!this.showIgnoredStepBS.value);
  }

  updatePrefillStep(body) {
    return this.apiService.postAPI(conversations, 'update-prefill-step', body);
  }

  updateShowStepDetailPanel(value: boolean) {
    this.showStepDetailPanel$.next(value);
  }
}

interface IEssentialParamOption {
  ignoreProperties?: string[];
  buttonKey: string | null;
  isCompletedStep?: boolean;
  isHasPrefillData?: boolean;
}

interface ICtaButtonPayload {
  stepId: string;
  stepType: EStepType;
  option: ECtaOption;
}

interface ICurrentStepPayload {
  step: TrudiStep & StepDetail;
  buttonKey: ButtonKey;
}

export interface StepDetailMap {
  [key: string]: StepDetail;
}

export interface UpdateTaskStepsPayload {
  taskId: string;
  taskStepIds: string[];
  isIgnored: boolean;
  stepName: string;
}
