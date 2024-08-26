import {
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import {
  EPropertyTreeType,
  ESyncStatus,
  IWidgetVacate
} from '@/app/task-detail/utils/functions';
import { ToastrService } from 'ngx-toastr';
import { StepBaseComponent } from '@/app/task-detail/modules/steps/communication/step-base/step-base.component';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { SendMessageService } from '@services/send-message.service';
import { ConversationService } from '@services/conversation.service';
import { FilesService } from '@services/files.service';
import { LeaseRenewalService } from '@services/lease-renewal.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { WidgetFormPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property-form.service';
import {
  mapActionComponent,
  mapComponentToPTState,
  toastComponentPT
} from '@/app/task-detail/modules/steps/constants/constants';
import { Subject, takeUntil } from 'rxjs';
import { IMaintenanceRequest } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-request.interface';
import { LeasingWidgetRequestTrudiResponse } from '@shared/types/trudi.interface';
import {
  EInvoiceTypeBS,
  InvoiceDataReq
} from '@shared/types/tenancy-invoicing.interface';
import { VacateDetailService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/vacate-detail.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ChatGptService } from '@services/chatGpt.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import {
  PTWidgetDataField,
  mapComponentToTitleKey
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { InvoicePopupManagerService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/invoice-popup-manager.service';
import {
  ESelectInvoiceType,
  SELECT_INVOICE_MAP
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/enum/popup.enum';
import { EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';

@Component({
  selector: 'property-tree-step',
  templateUrl: './property-tree.component.html',
  styleUrls: ['./property-tree.component.scss']
})
export class PropertyTreeComponent
  extends StepBaseComponent
  implements OnInit, OnChanges, OnDestroy
{
  public PTWidgetComponent:
    | InvoiceDataReq[]
    | IWidgetVacate[]
    | IMaintenanceRequest[]
    | LeasingWidgetRequestTrudiResponse[] = [];

  private unsubscribe = new Subject<void>();

  public enableInvoice: boolean = false;

  public stepName: string = null;

  public currentInvoicePopup: ESelectInvoiceType = null;
  public buttonKey;

  constructor(
    public override taskService: TaskService,
    public override trudiService: TrudiService,
    public override sendMessageService: SendMessageService,
    public override conversationService: ConversationService,
    public override toastService: ToastrService,
    public override filesService: FilesService,
    public override stepService: StepService,
    private widgetFormPTService: WidgetFormPTService,
    private vacateDetailService: VacateDetailService,
    public widgetPTService: WidgetPTService,
    public override chatGptService: ChatGptService,
    public override trudiDynamicParameterService: TrudiDynamicParameterService,
    public invoicePopupManager: InvoicePopupManagerService,
    private PreventButtonService: PreventButtonService,
    public override toastCustomService: ToastCustomService
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

  override ngOnInit(): void {
    this.widgetPTService
      .getPopupWidgetState()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) {
          this.stepService.setCurrentPTStep(null);
        }
      });
    const dataFieldWidget = mapComponentToPTState[this.modelData.componentType];
    this.handleUpdateComponentType();
    this.widgetPTService
      .getPTWidgetStateByType<
        | InvoiceDataReq[]
        | IWidgetVacate[]
        | IMaintenanceRequest[]
        | LeasingWidgetRequestTrudiResponse[]
      >(dataFieldWidget)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.PTWidgetComponent = res;
      });

    if (
      this.modelData?.componentType ===
      EPropertyTreeButtonComponent.MAINTENANCE_INVOICE
    ) {
      this.widgetPTService
        .getPTWidgetStateByType<IMaintenanceRequest[]>(
          PTWidgetDataField.MAINTENANCE_REQUEST
        )
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res.length && res[0].syncStatus === ESyncStatus.COMPLETED) {
            this.enableInvoice = true;
          }
        });
    }

    this.stepService.updateStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (
          this.model?.action === data?.action &&
          this.model?.componentType === data?.componentType &&
          (this.model?.id === data?.id ||
            this.stepService.isUpdateBtnFromPTWidget$.getValue())
        ) {
          this.modelData = { ...this.model, status: data?.status };
          this.complete(null, { widgetId: data?.widgetId });
        }
      });

    this.stepService.getTrudiResponse
      .pipe(takeUntil(this.destroy$))
      .subscribe((trudiResponse) => {
        if (!trudiResponse) return;
        const { componentType } = this.modelData;
        const buttons = this.stepService.getButton(trudiResponse);
        const buttonCreate = buttons.find(
          (button) =>
            (button.componentType === componentType &&
              button.action === EButtonAction.PT_NEW_COMPONENT) ||
            (button.componentType === EPropertyTreeButtonComponent.NOTE &&
              componentType === EPropertyTreeType.UPDATE_NOTES) ||
            (button.componentType === EPropertyTreeButtonComponent.COMPLIANCE &&
              componentType === EPropertyTreeType.UPDATE_COMPLIANCE)
        );
        this.stepName = buttonCreate?.name;
      });

    this.invoicePopupManager.currentPopup$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.currentInvoicePopup = rs;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']?.currentValue) {
      this.modelData = this.model;
      this.buttonKey = mapComponentToTitleKey[this.model?.componentType];
      this.handleUpdateComponentType();
    }
  }

  handleUpdateComponentType() {
    const newComponentType =
      mapActionComponent[this.modelData.action]?.[this.modelData.componentType];

    if (newComponentType) {
      this.modelData = { ...this.modelData, componentType: newComponentType };
    } else {
      this.modelData = { ...this.modelData };
    }
  }

  handleShowPopupVacateDetails() {
    if (
      this.modelData?.componentType ===
      EPropertyTreeButtonComponent.VACATE_DETAIL
    ) {
      if (this.PTWidgetComponent?.length) {
        this.widgetFormPTService.setFormModal(
          this.PTWidgetComponent[0] as IWidgetVacate
        );
        this.vacateDetailService.syncStatusPtWidgetTenantVacate.next(
          this.PTWidgetComponent[0]['status']
        );
      }
    }
  }

  enableProcess() {
    const toastMessage = toastComponentPT[this.modelData?.componentType];
    if (toastComponentPT.hasOwnProperty(this.modelData?.componentType)) {
      if (
        this.modelData?.componentType ===
          EPropertyTreeButtonComponent.MAINTENANCE_INVOICE &&
        !this.enableInvoice
      ) {
        this.toastService.error(toastMessage);
        this.clearProcess();
        this.stepService.setCurrentStep(null);
        return;
      } else if (
        this.modelData?.componentType !==
          EPropertyTreeButtonComponent.MAINTENANCE_INVOICE &&
        this.PTWidgetComponent?.length > 0 &&
        this.modelData.action === EButtonAction.PT_NEW_COMPONENT
      ) {
        this.toastService.error(toastMessage);
        this.clearProcess();
        this.stepService.setCurrentStep(null);
        return;
      }
    }

    const tenancyInvoices = (
      this.PTWidgetComponent as InvoiceDataReq[]
    )?.filter(
      (item: InvoiceDataReq) =>
        item?.invoiceWidgetType === EInvoiceTypeBS.TENANCY
    );

    if (
      (this.PTWidgetComponent?.length === 0 ||
        (tenancyInvoices?.length === 0 &&
          this.modelData.componentType ===
            EPropertyTreeButtonComponent.TENANCY_INVOICE)) &&
      this.modelData.action === EButtonAction.PT_UPDATE_COMPONENT
    ) {
      const toastMsg = `You must complete the following action first: ${this.stepName}`;
      this.toastService.error(toastMsg);
      this.clearProcess();
      this.stepService.setCurrentStep(null);
      return;
    }

    this.handleShowPopupVacateDetails();

    this.stepService.setCurrentPTStep(this.model);
    if (
      this.modelData.action === EButtonAction.PT_UPDATE_COMPONENT &&
      (this.modelData.componentType === EPropertyTreeType.CREDITOR_INVOICE ||
        this.modelData.componentType === EPropertyTreeType.TENANCY_INVOICE ||
        this.modelData.componentType ===
          EPropertyTreeType.MAINTENANCE_INVOICE ||
        this.modelData.componentType === EPropertyTreeType.ROUTINE_INSPECTION ||
        this.modelData.componentType === EPropertyTreeType.INGOING_INSPECTION ||
        this.modelData.componentType === EPropertyTreeType.OUTGOING_INSPECTION)
    ) {
      this.stepService.setModalDataPT(this.modelData);
      this.widgetPTService.setPopupWidgetState(EPropertyTreeType.UPDATE_WIDGET);
    } else if (this.isCreateInvoiceComponentType) {
      this.showSelectInvoiceModal(
        this.modelData.componentType as EPropertyTreeType
      );
    } else {
      this.widgetPTService.setPopupWidgetState(
        this.modelData?.componentType as EPropertyTreeType
      );
    }
  }

  public get isCreateInvoiceComponentType() {
    return (
      this.modelData.action === EButtonAction.PT_NEW_COMPONENT &&
      [
        EPropertyTreeType.MAINTENANCE_INVOICE,
        EPropertyTreeType.TENANCY_INVOICE,
        EPropertyTreeType.CREDITOR_INVOICE
      ].includes(this.modelData.componentType as EPropertyTreeType)
    );
  }

  private clearProcess = () => {
    setTimeout(() => {
      this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
    });
  };

  showSelectInvoiceModal(invoiceType: EPropertyTreeType) {
    this.invoicePopupManager.setShowSelectInvoiceModal(true);
    this.invoicePopupManager.buildSelectForm();
    this.invoicePopupManager.setCurrentPopup(SELECT_INVOICE_MAP[invoiceType]);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    if (!this.currentInvoicePopup) {
      this.widgetPTService.setPopupWidgetState(null);
    }
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
