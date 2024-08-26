import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, takeUntil } from 'rxjs';
import { ConversationService } from '@services/conversation.service';
import { conversations } from 'src/environments/environment';
import {
  LeaseRenewalDecision,
  LeaseRenewalRequestButtonAction
} from '@shared/enum/lease-renewal-Request.enum';

import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { SendBulkMessageResponse } from '@shared/types/conversation.interface';
import {
  FrequencyRental,
  LeasePeriodType,
  LeaseRenewalRequestTrudiResponse,
  LeaseRenewalRequestTrudiVariable,
  LeaseRenewalRequestTrudiVariableReceiver,
  ICaptureLeaseTermResponse
} from '@shared/types/trudi.interface';
import { Personal, UserItemInMessagePopup } from '@shared/types/user.interface';
import { ApiService } from './api.service';
import { TaskService } from './task.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import {
  commencingSync,
  VariableFixedTermLease,
  variableSync
} from '@shared/types/lease-renewal.interface';
import { ReiFormData } from '@shared/types/rei-form.interface';
import {
  EPropertyTreeType,
  ITimeSyncLease,
  IWidgetLease
} from '@/app/task-detail/utils/functions';
import dayjs from 'dayjs';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { EButtonAction } from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import {
  EComponentTypes,
  EStepAction
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { EActionType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
@Injectable({
  providedIn: 'root'
})
export class LeaseRenewalService {
  public leaseRenewalRequestResponse: BehaviorSubject<LeaseRenewalRequestTrudiResponse> =
    new BehaviorSubject(null);
  public leaseRenewalFloatingDisplayStatus$: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public trudiConversationId: BehaviorSubject<string> = new BehaviorSubject('');
  public statusVacating: BehaviorSubject<string> = new BehaviorSubject('');
  public editedLeaseTermFormData$: BehaviorSubject<LeaseRenewalRequestTrudiVariable> =
    new BehaviorSubject(null);
  public taskId: string = '';
  public mapKeyword: BehaviorSubject<any> = new BehaviorSubject({});
  public getStatusReiForm: BehaviorSubject<any> = new BehaviorSubject({});
  public getFileTenant$: BehaviorSubject<any> = new BehaviorSubject(false);
  public openPopupWidgetState$: BehaviorSubject<EPropertyTreeType> =
    new BehaviorSubject<EPropertyTreeType>(null);
  public trudiDataSyncResponse = new BehaviorSubject<IWidgetLease>(null);
  public openTimeStatusSyncLease: BehaviorSubject<ITimeSyncLease> =
    new BehaviorSubject<ITimeSyncLease>(null);

  private captureLeaseTermData: ICaptureLeaseTermResponse;
  private trudiResponse: LeaseRenewalRequestTrudiResponse;
  private unsubscribe$ = new Subject<void>();

  private get dateFormat$() {
    return this.agencyDateFormatService.dateFormat$.getValue();
  }

  constructor(
    private apiService: ApiService,
    private conversationService: ConversationService,
    private activatedRoute: ActivatedRoute,
    private taskService: TaskService,
    private stepService: StepService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {
    this.handleGetTrudiConversationId();
    combineLatest([
      this.stepService.captureLeaseTermData$,
      this.stepService.getTrudiResponse
    ])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(([captureLeaseTermData, trudiResponse]) => {
        this.captureLeaseTermData = captureLeaseTermData;
        this.trudiResponse = trudiResponse;
      });
  }

  get getTimeAndStatusSync() {
    return this.openTimeStatusSyncLease;
  }

  set updateTimeAndStatusSync(data: ITimeSyncLease) {
    this.openTimeStatusSyncLease.next(data);
  }

  get getSyncDataLeaseResponse() {
    return this.trudiDataSyncResponse;
  }

  set updateDataSyncResponse(data: IWidgetLease) {
    this.trudiDataSyncResponse.next(data);
  }
  getSendMessageTitle() {
    return `Lease Renewal - ${this.taskService.getShortPropertyAddress()}`;
  }

  findGroupLeaseById(idTenancy: string, tenanciesItems: Personal[]) {
    return (
      tenanciesItems
        .flatMap((data) => data.userPropertyGroupLeases || [])
        .find((lease) => lease.idUserPropertyGroup === idTenancy) || {}
    );
  }

  getOpenPopupWidgetState() {
    return this.openPopupWidgetState$.value;
  }

  setOpenPopupWidgetState(value: EPropertyTreeType) {
    this.openPopupWidgetState$.next(value);
  }

  chooseDecision(taskId: string, decisionIndex: number) {
    return this.apiService.postAPI(
      conversations,
      'lease-renewal/confirm-decision',
      {
        taskId,
        decisionIndex
      }
    );
  }

  confirmTenancy(taskId: string, tenancyId: string) {
    return this.apiService.postAPI(
      conversations,
      'lease-renewal/confirm-tenancy',
      {
        taskId,
        tenancyId
      }
    );
  }

  changeDecisionRequestApprovalStatus(
    conversationId: string,
    stepIndex: number,
    status: LeaseRenewalDecision
  ) {
    return this.apiService.postAPI(
      conversations,
      'we need update update api link here!',
      {
        conversationId,
        stepIndex,
        status
      }
    );
  }

  handleGetTrudiConversationId() {
    const currentConversationList =
      this.conversationService.listConversationByTask.getValue();
    if (currentConversationList && currentConversationList.length) {
      const trudiConversation = currentConversationList.find(
        (item) => item.trudiResponse
      );
      this.trudiConversationId.next(trudiConversation?.id);
    }
  }

  updateResponseData(action: string, data: any) {
    if (!action) throw new Error('there must be action');
    this.leaseRenewalRequestResponse.next(data);
  }

  updateButtonStatus(action: string, status: TrudiButtonEnumStatus) {
    return this.apiService.postAPI(
      conversations,
      'lease-renewal/update-status-button',
      { taskId: this.taskService.currentTask$.value.id, action, status }
    );
  }

  saveVariable(bodySaveVariable: {
    taskId: string;
    leasePeriod: number;
    leasePeriodType: LeasePeriodType;
    rentedAt;
    rentAmount: number;
    frequency: FrequencyRental;
    description: string;
    receivers?: LeaseRenewalRequestTrudiVariableReceiver[];
    reiFormInfor?: {
      action: string;
      formData: ReiFormData | {};
    };
  }) {
    const {
      taskId,
      leasePeriod,
      leasePeriodType,
      rentedAt,
      rentAmount,
      frequency,
      description,
      receivers,
      reiFormInfor
    } = bodySaveVariable;
    return this.apiService.postAPI(
      conversations,
      'lease-renewal/save-variable',
      {
        taskId,
        leasePeriod,
        leasePeriodType,
        rentedAt,
        rentAmount,
        frequency,
        description,
        receivers,
        reiFormInfor
      }
    );
  }

  syncVacateTenacy(body: {
    propertyId: string;
    taskId: string;
    variable?: variableSync;
  }) {
    const { propertyId, taskId, variable } = body;
    return this.apiService.postAPI(
      conversations,
      `lease-renewal/sync-pt-vacate-tenancy`,
      {
        propertyId,
        taskId,
        variable
      }
    );
  }

  syncCommencing(body: {
    propertyId: string;
    taskId: string;
    variable?: commencingSync;
  }) {
    return this.apiService.postAPI(
      conversations,
      `lease-renewal/sync-pt-commence-date`,
      body
    );
  }

  syncFixedTermLease(body: {
    propertyId: string;
    taskId: string;
    agencyId: string;
    variable?: VariableFixedTermLease;
  }) {
    return this.apiService.postAPI(
      conversations,
      'lease-renewal/sync-pt-fixed-term-lease',
      body
    );
  }

  getLeaseRenewalSync(taskId: string) {
    return this.apiService.getData(
      `${conversations}lease-renewal/get-all-lease-renewal-sync-by-taskId?taskId=${taskId}`
    );
  }

  removeLeaseRenewalSync(body: { taskId: string }) {
    return this.apiService.deleteAPI(
      conversations,
      'lease-renewal/remove-sync-to-property-tree',
      body
    );
  }

  checkTaskHasConversationWithTypeAndAction(
    receivers: LeaseRenewalRequestTrudiVariableReceiver[],
    type: EUserPropertyType,
    action: LeaseRenewalRequestButtonAction
  ) {
    return receivers.some(
      (receiver) =>
        receiver.userPropertyType === type &&
        (receiver.raiseBy === 'USER' ||
          (receiver.action !== action && receiver.raiseBy === 'AGENT'))
    );
  }

  mapUserItemInMessagePopupToReceiver(
    list: UserItemInMessagePopup[]
  ): LeaseRenewalRequestTrudiVariableReceiver[] {
    return list.map((el) => {
      return {
        id: el.id,
        firstName: el.firstName,
        lastName: el.lastName,
        userPropertyType: el.type as EUserPropertyType,
        lastActivity: el.lastActivity,
        email: el.email,
        inviteSent: el.inviteSent,
        offBoardedDate: el.offBoarded,
        isPrimary: el.isPrimary
      };
    });
  }

  findConversationIdByPersonUserId(
    personUserId: string,
    sendBulkResponse: SendBulkMessageResponse[]
  ) {
    return sendBulkResponse.find((el) => el.personUserId === personUserId)
      .conversationId;
  }

  countUserInList(
    list: LeaseRenewalRequestTrudiVariableReceiver[],
    type: EUserPropertyType
  ) {
    return list.filter((item) => item.userPropertyType === type).length;
  }

  mapConversationToUser(
    receivers: LeaseRenewalRequestTrudiVariableReceiver[],
    newUsers: LeaseRenewalRequestTrudiVariableReceiver[],
    res: SendBulkMessageResponse[],
    action: LeaseRenewalRequestButtonAction
  ) {
    const oldReceivers = receivers.map((receiver) => ({
      ...receiver,
      conversationId:
        receiver.raiseBy !== 'USER' && !receiver.conversationId
          ? this.findConversationIdByPersonUserId(receiver.id, res)
          : receiver.conversationId
    }));
    const oldReceiverIds = oldReceivers.map((e) => e.id);
    const newReceiver = newUsers
      .filter((user) => !oldReceiverIds.includes(user.id))
      .map((el) => ({
        ...el,
        conversationId: this.findConversationIdByPersonUserId(el.id, res),
        action: action,
        raiseBy: EUserPropertyType.AGENT
      }));

    return [...oldReceivers, ...newReceiver];
  }

  getPrefillDataFromLastStep(
    startDate: string,
    endDate: string,
    rentAmount: number | string,
    frequency: FrequencyRental
  ) {
    const {
      leasePeriod,
      leasePeriodType,
      rentAmount: rentAmountFromLastStep,
      frequency: frequencyFromLastStep
    } = this.trudiResponse?.leaseTerm || this.captureLeaseTermData || {};

    const isPrefillDataAvailable =
      leasePeriod &&
      leasePeriodType &&
      frequencyFromLastStep &&
      rentAmountFromLastStep;

    const buttons = this.stepService.getButton(this.trudiResponse);

    const isCaptureLeaseTermsCompleted =
      buttons?.find(({ action }) => action === EStepAction.CAPTURE_LEASE_TERMS)
        ?.status === TrudiButtonEnumStatus.COMPLETED;

    if (!isPrefillDataAvailable || !isCaptureLeaseTermsCompleted)
      return {
        leaseStart: startDate,
        leaseEnd: endDate,
        rent: rentAmount,
        frequencyRent: frequency
      };

    const originalDate = endDate || startDate;

    const formatTimezone = (date: string) => {
      return this.agencyDateFormatService.formatTimezoneDate(
        date,
        this.dateFormat$.DATE_FORMAT_MONTH
      );
    };

    const leaseStart = originalDate
      ? formatTimezone(dayjs(originalDate).add(1, 'day').toString())
      : null;

    const leaseEnd = originalDate
      ? formatTimezone(
          dayjs(originalDate)
            .add(1, 'day')
            .add(
              leasePeriod,
              leasePeriodType?.toLowerCase() as dayjs.ManipulateType
            )
            .toString()
        )
      : null;
    const rent = rentAmountFromLastStep;
    const frequencyRent = frequencyFromLastStep;
    return { leaseStart, leaseEnd, rent, frequencyRent };
  }

  updateButtonLeaseRenewalStatus(widgetId?) {
    const currentStep = this.stepService.currentPTStep.getValue();
    this.stepService
      .updateStep(
        this.taskService.currentTask$.value?.id,
        currentStep?.id,
        currentStep
          ? EButtonAction[currentStep?.action.toUpperCase()]
          : EButtonAction.PT_NEW_COMPONENT,
        TrudiButtonEnumStatus.COMPLETED,
        ECRMSystem.PROPERTY_TREE,
        EComponentTypes.LEASE_RENEWAL,
        widgetId
      )
      .subscribe((data) => {
        this.stepService.updateTrudiResponse(data, EActionType.UPDATE_PT);
        this.stepService.setChangeBtnStatusFromPTWidget(false);
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
