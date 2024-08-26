import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ChatGptService } from '@services/chatGpt.service';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { LeaseRenewalService } from '@services/lease-renewal.service';
import { SendMessageService } from '@services/send-message.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { IWidgetLease } from '@/app/task-detail/utils/functions';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { StepBaseComponent } from '@/app/task-detail/modules/steps/communication/step-base/step-base.component';
import {
  mapComponentToPTState,
  toastComponentPT
} from '@/app/task-detail/modules/steps/constants/constants';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ERentManagerAction } from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { PopupManagementService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/popup-management.service';
import { ERentManagerIssuePopup } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { RentManagerIssueFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-form.service';
import { RentManagerNotesFormService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-notes/services/rent-manager-notes-form.service';
import { FormVacateDetailService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-vacate-detail/vacate-detail-form/vacate-detail-form.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'rent-manager',
  templateUrl: './rent-manager.component.html',
  styleUrls: ['./rent-manager.component.scss']
})
export class RentManagerComponent extends StepBaseComponent implements OnInit {
  @Input() disabled = false;
  constructor(
    private leaseRenewalService: LeaseRenewalService,
    public override conversationService: ConversationService,
    public override toastService: ToastrService,
    public agencyService: AgencyService,
    private widgetRMService: WidgetRMService,
    public override stepService: StepService,
    public override taskService: TaskService,
    public override trudiService: TrudiService,
    public override sendMessageService: SendMessageService,
    public override filesService: FilesService,
    public override chatGptService: ChatGptService,
    public override trudiDynamicParameterService: TrudiDynamicParameterService,
    public override toastCustomService: ToastCustomService,
    private popupManagementService: PopupManagementService,
    private rentManagerNotesFormService: RentManagerNotesFormService,
    private rentManagerIssueFormService: RentManagerIssueFormService,
    private rmVacateDetaiFormService: FormVacateDetailService
  ) {
    super(
      taskService,
      trudiService,
      sendMessageService,
      conversationService,
      toastService,
      filesService,
      stepService,
      chatGptService,
      trudiDynamicParameterService,
      toastCustomService
    );
  }
  public isCompleted: boolean = false;
  public isProcessing: boolean = false;
  public CRMSystemName = ECRMSystem;
  public RMWidgetComponent: IWidgetLease[] = [];
  public stepName: string = null;

  public errLeaseStep = {
    errLinkedLease: 'Lease renewal is already linked to this task'
  };
  private unsubscribe = new Subject<void>();
  override ngOnInit(): void {
    this.stepService.updateStatus
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (
          this.model?.action === data?.action &&
          this.model?.componentType === data?.componentType &&
          (this.model?.id === data?.id ||
            this.stepService.isUpdateBtnFromRMWidget$.getValue())
        ) {
          this.modelData = { ...this.model, status: data?.status };
          this.complete();
        }
      });
    const dataFieldWidget = mapComponentToPTState[this.modelData.componentType];
    this.widgetRMService
      .getRMWidgetStateByType<IWidgetLease[]>(dataFieldWidget)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.RMWidgetComponent = res;
      });

    this.stepService.getTrudiResponse
      .pipe(takeUntil(this.destroy$))
      .subscribe((trudiResponse) => {
        if (!trudiResponse) return;
        const { componentType } = this.modelData;
        const buttons = this.stepService.getButton(trudiResponse);
        const buttonCreate = buttons.find(
          (button) =>
            button.componentType === componentType &&
            button.action === ERentManagerAction.RM_NEW_COMPONENT
        );
        this.stepName = buttonCreate?.name;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']?.currentValue) {
      this.modelData = this.model;
    }
  }

  refresh() {
    this.leaseRenewalService
      .updateButtonStatus(this.model.action, TrudiButtonEnumStatus.PENDING)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          res &&
            this.leaseRenewalService.updateResponseData(this.model.action, res);
          this.conversationService.reloadConversationList.next(true);
        }
      });
  }

  skip() {
    this.leaseRenewalService
      .updateButtonStatus(this.model.action, TrudiButtonEnumStatus.SKIP)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          res &&
            this.leaseRenewalService.updateResponseData(this.model.action, res);
        }
      });
  }

  enableProcess() {
    const toastMessage = toastComponentPT[this.modelData?.componentType];
    if (toastComponentPT.hasOwnProperty(this.modelData?.componentType)) {
      if (
        this.RMWidgetComponent?.length > 0 &&
        this.modelData.action === ERentManagerAction.RM_NEW_COMPONENT
      ) {
        this.toastService.error(toastMessage);
        return;
      }
    }
    if (
      this.RMWidgetComponent?.length === 0 &&
      this.modelData.action === ERentManagerAction.RM_UPDATE_COMPONENT
    ) {
      const toastMsg = `You must complete the following action first: ${this.stepName}`;
      this.toastService.error(toastMsg);
      return;
    }
    this.stepService.setCurrentRMStep(this.model);
    switch (this.modelData.componentType) {
      case ERentManagerType.ISSUE:
        if (this.modelData.action === ERentManagerAction.RM_UPDATE_COMPONENT) {
          this.stepService.setModalDataPT(this.modelData);
          this.widgetRMService.setPopupWidgetState(
            ERentManagerType.UPDATE_RM_POPUP
          );
          return;
        } else {
          this.rentManagerIssueFormService.buildForm();
          this.popupManagementService.setCurrentPopup(
            ERentManagerIssuePopup.RM_ISSUE_POPUP
          );
        }
        break;
      case ERentManagerType.LEASE_RENEWAL:
        this.widgetRMService.setPopupWidgetState(
          this.modelData?.componentType as ERentManagerType
        );
        break;
      case ERentManagerType.INSPECTION:
        if (this.modelData.action === ERentManagerAction.RM_UPDATE_COMPONENT) {
          this.stepService.setModalDataPT(this.modelData);
          this.widgetRMService.setPopupWidgetState(
            ERentManagerType.UPDATE_RM_POPUP
          );
          return;
        } else {
          this.widgetRMService.setPopupWidgetState(ERentManagerType.INSPECTION);
        }
        break;
      case ERentManagerType.NOTES:
        if (this.modelData.action === ERentManagerAction.RM_UPDATE_COMPONENT) {
          this.stepService.setModalDataPT(this.modelData);
          this.widgetRMService.setPopupWidgetState(
            ERentManagerType.UPDATE_RM_POPUP
          );
          return;
        } else {
          this.rentManagerNotesFormService.buildForm();
          this.widgetRMService.setPopupWidgetState(ERentManagerType.NOTES);
        }
        break;
      case ERentManagerType.VACATE_DETAIL:
        this.widgetRMService.setPopupWidgetState(
          this.modelData?.componentType as ERentManagerType
        );
        if (this.modelData.action === ERentManagerAction.RM_UPDATE_COMPONENT) {
          const [vacateDetail] =
            this.widgetRMService[RMWidgetDataField.VACATE_DETAIL]?.getValue();
          this.rmVacateDetaiFormService.form.get('tenancyId').disable();
          this.rmVacateDetaiFormService.form.patchValue(vacateDetail);
          return;
        }
        break;
      case ERentManagerType.NEW_TENANT:
        if (this.modelData.action === ERentManagerAction.RM_UPDATE_COMPONENT) {
          this.stepService.setModalDataPT(this.modelData);
          this.widgetRMService.setPopupWidgetState(
            ERentManagerType.UPDATE_RM_POPUP
          );
          return;
        } else {
          this.widgetRMService.setPopupWidgetState(ERentManagerType.NEW_TENANT);
        }
        break;
      default:
        break;
    }
  }

  override ngOnDestroy(): void {
    this.leaseRenewalService.setOpenPopupWidgetState(null);
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
