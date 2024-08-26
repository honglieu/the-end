import { Inject, Injectable, InjectionToken } from '@angular/core';
import {
  EButtonStepKey,
  EButtonType,
  ButtonKey,
  buttonMap,
  EButtonTask,
  EButtonCommonKey,
  StepKey,
  isActionOpenOnceModal,
  EButtonWidget
} from './prevent-button.contstant';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { isNumber } from 'lodash-es';
import { TrudiModalManager } from '../../interfaces';
export const TRUDI_MODAL_MANAGER = new InjectionToken<TrudiModalManager>(
  'TRUDI_MODAL_MAGAGER'
);
@Injectable({
  providedIn: 'root'
})
export class PreventButtonService {
  private currentProcessStepList: Set<EButtonStepKey> = new Set();
  private currentModalActives: Set<string | number> = new Set();

  private triggerWarningModal: Subject<any> = new Subject();
  public triggerWarningModal$ = this.triggerWarningModal.asObservable();

  private triggerChangeProcess: Subject<boolean> = new Subject();
  public triggerChangeProcess$ = this.triggerChangeProcess.asObservable();

  constructor(
    @Inject(TRUDI_MODAL_MANAGER) private trudiModal,
    private router: Router
  ) {}

  public shouldHandleProcess(
    buttonKey: ButtonKey,
    buttonType: EButtonType,
    dispatchWarning: boolean = true
  ) {
    let next: boolean = false;
    const processList = buttonMap[buttonType];
    if (!processList.has(buttonKey)) return true;
    switch (buttonType) {
      case EButtonType.TASK:
        next = this.shouldHandleTaskAction(buttonKey as EButtonTask);
        break;
      case EButtonType.COMMON:
        next = this.shouldHandleCommonAction(buttonKey as EButtonCommonKey);
        break;
      case EButtonType.STEP:
      case EButtonType.WIDGET:
        next = this.shouldHandleStepProcess(buttonKey as EButtonStepKey);
        break;
      case EButtonType.ROUTER:
        next = this.shouldHandleRouteProcess();
        break;
      default:
    }

    if (!next && dispatchWarning) {
      const lastProcessKey = this.getLastActiveAction();
      this.setTriggerWarningModal({
        id: lastProcessKey
      });
    }
    return next;
  }

  private getLastActiveAction() {
    const [...activeActions] = this.currentModalActives;
    return activeActions[activeActions.length - 1];
  }

  private shouldHandleStepProcess(buttonKey: string) {
    const lastProcessKey = this.getLastActiveAction();
    if (
      (this.currentModalActives?.size === 1 &&
        buttonKey === EButtonStepKey.NEW_TASK) ||
      lastProcessKey === EButtonStepKey.NEW_TASK ||
      (this.currentModalActives?.size === 1 &&
        buttonKey === EButtonWidget.REI_FORM) ||
      lastProcessKey === EButtonWidget.REI_FORM
    ) {
      return false;
    }

    const filteredCurrentModalActives = new Set(
      [...this.currentModalActives]?.filter((item) => item !== 3)
    );

    // TODO: check impact with size = 3
    if (filteredCurrentModalActives?.size === 3) {
      return false;
    }
    if (isActionOpenOnceModal.includes(buttonKey as any)) {
      if (this.currentModalActives?.size >= 1) {
        return false;
      }
    }

    if (
      this.isStepFlow(buttonKey, 'propertyTree') &&
      this.currentAccessFlow('propertyTree')
    ) {
      return false;
    }

    if (
      this.isStepFlow(buttonKey, 'communicationStep') &&
      this.currentAccessFlow('communicationStep')
    ) {
      return false;
    }

    if (
      this.isStepFlow(buttonKey, 'eventStep') &&
      this.currentAccessFlow('eventStep')
    ) {
      return false;
    }

    if (this.isStepFlow(buttonKey, 'communicationStep') && this.hasTaskFlow()) {
      return false;
    }
    return true;
  }

  private hasTaskFlow() {
    for (let step of this.currentModalActives) {
      if (isNumber(step) && step === 2) {
        return true;
      }
    }
    return false;
  }

  private shouldHandleTaskAction(buttonKey): boolean {
    if (
      this.currentModalActives?.size < 2 &&
      this.currentAccessFlow('propertyTree') &&
      !this.currentAccessFlow('communicationStep') &&
      buttonKey === EButtonTask.TASK_CREATE_MESSAGE
    ) {
      return true;
    }

    if (this.isTaskDetailRoute && this.currentModalActives.size > 0) {
      return false;
    }

    const listActivePrevent = [
      EButtonTask.TASK_CREATE_MESSAGE,
      EButtonTask.CREATE_CONVERSATION,
      EButtonTask.FORWARD_MESSAGE,
      EButtonTask.SEND_MESSAGE,
      EButtonTask.VIEW_FILE,
      EButtonTask.SEND_FILE,
      EButtonTask.ADD_CONTACT,
      EButtonTask.SELECT_SUMMARY_ATTACHMENT,
      EButtonTask.SHARE_CALENDAR_EVENT
    ];

    if (this.isTaskDetailRoute)
      listActivePrevent.push(EButtonTask.TASK_CREATE_TASK);
    if (this.isOpenSendMsgModal) {
      return !listActivePrevent.includes(buttonKey);
    }

    return true;
  }

  private shouldHandleCommonAction(buttonKey: EButtonCommonKey): boolean {
    // handle more case
    if (this.isTaskDetailRoute && this.currentProcessStepList.size > 0) {
      return false;
    }

    if (this.isOpenSendMsgModal) {
      return ![
        EButtonCommonKey.EMAIL_ACTIONS,
        EButtonCommonKey.CONTACT_PAGE_SMG,
        EButtonCommonKey.COMMON_SEARCH_GLOBAL
      ].includes(buttonKey);
    }

    return true;
  }
  private shouldHandleRouteProcess(): boolean {
    if (!this.isTaskDetailRoute) return true;
    if (this.currentProcessStepList.size > 0 || this.isOpenSendMsgModal)
      return false;
    return true;
  }

  // check open flow property or communication, etc
  private currentAccessFlow(key: string) {
    const steps = new Set(Object.values(StepKey[key]));
    for (let step of this.currentProcessStepList) {
      if (steps.has(step)) {
        return true;
      }
    }
    return false;
  }

  private isStepFlow(key: string, stepType: string) {
    const steps = new Set(Object.values(StepKey[stepType]));
    if (steps.has(key)) {
      return true;
    }
    return false;
  }

  public setCurrentProcess(buttonKey: ButtonKey, type: EButtonType) {
    if (
      type === EButtonType.STEP ||
      (type === EButtonType.WIDGET &&
        (buttonKey === EButtonWidget.CALENDAR ||
          buttonKey === EButtonWidget.REI_FORM))
    ) {
      this.currentProcessStepList.add(buttonKey as EButtonStepKey);
      this.setCurrentModalActive(buttonKey);
    }
    this.triggerChangeProcess.next(true);
  }

  public deleteProcess(buttonKey: ButtonKey, type: EButtonType) {
    if (
      type === EButtonType.STEP ||
      (type === EButtonType.WIDGET &&
        (buttonKey === EButtonWidget.CALENDAR ||
          buttonKey === EButtonWidget.REI_FORM))
    ) {
      this.currentProcessStepList.delete(buttonKey as EButtonStepKey);
    }

    this.deleteCurrentModalActive(buttonKey);
    // delete done clear order process change last process key
    this.triggerChangeProcess.next(true);
  }

  public clearProcess(type: EButtonType) {
    if (type === EButtonType.STEP) {
      this.currentProcessStepList.clear();
      this.clearCurrentModalActives();
    }
    this.triggerChangeProcess.next(true);
  }

  setCurrentModalActive(key: string) {
    this.currentModalActives.add(key);
  }

  deleteCurrentModalActive(key: string) {
    this.currentModalActives.delete(key);
  }

  clearCurrentModalActives() {
    this.currentModalActives.clear();
  }

  get isCurrentModalActive() {
    return this.currentModalActives.size > 0;
  }

  setTriggerWarningModal(value) {
    this.triggerWarningModal.next(value);
  }

  handleClick(
    buttonKey: ButtonKey,
    buttonType: EButtonType,
    event: MouseEvent,
    emitEvent: (event: MouseEvent, payload: ClickEventPayload | null) => void
  ) {
    if (!buttonKey) return emitEvent(event, null);
    const stopHandle = !this.shouldHandleProcess(buttonKey, buttonType);
    if (stopHandle) {
      emitEvent(event, { stopHandle });
    } else {
      this.setCurrentProcess(buttonKey, buttonType);
      emitEvent(event, null);
    }
  }

  private get isOpenSendMsgModal() {
    return !!this.trudiModal?.openModalIds?.length;
  }

  private get isTaskDetailRoute() {
    return this.router.url.search('/dashboard/inbox/detail') !== -1;
  }
}
interface ClickEventPayload {
  stopHandle?: boolean;
}
