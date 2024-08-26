import { ComplianceFormService } from '@/app/compliance/services/compliance-form.service';
import { ComplianceService } from '@/app/compliance/services/compliance.service';
import { ESelectOpenComplianceItemPopup } from '@/app/compliance/utils/compliance.enum';
import {
  InspectionSyncData,
  InvoiceDataReq,
  TrudiButtonEnumStatus
} from '@/app/shared';
import { PtNote } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/note/sync-note-popup/note-sync.interface';
import { IMaintenanceInvoice } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-invoice.interface';
import { mapComponentToTitle } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { CreditorInvoicingPropertyService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/creditor-invoice.service';
import { IngoingInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/ingoing-inspection.service';
import { MaintenanceInvoiceFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-invoice-form.service';
import { OutgoingInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/outgoing-inspection.service';
import { RoutineInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/routine-inspection.service';
import { TenancyInvoiceService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/tenancy-invoice.service';
import { WidgetNoteService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-note.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { mapComponentToPTState } from '@/app/task-detail/modules/steps/constants/constants';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import {
  StepDetail,
  TrudiStep
} from '@/app/task-detail/modules/steps/utils/stepType';
import {
  EPropertyTreeOption,
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'crm-step-summary',
  templateUrl: './crm-step-summary.component.html',
  styleUrl: './crm-step-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CRMStepSummaryComponent implements OnInit, OnDestroy {
  @Input() currentStep: TrudiStep & StepDetail;
  public listWidgets;
  EStepStatus = TrudiButtonEnumStatus;
  EButtonAction = EButtonAction;
  mapComponentToTitle = mapComponentToTitle;
  private unsubscribe = new Subject<void>();

  constructor(
    private widgetPTService: WidgetPTService,
    private routineInspectionSyncService: RoutineInspectionSyncService,
    private creditorInvoicingPropertyService: CreditorInvoicingPropertyService,
    public tenancyInvoiceService: TenancyInvoiceService,
    public outgoingInspectionSyncService: OutgoingInspectionSyncService,
    public ingoingInspectionSyncService: IngoingInspectionSyncService,
    private maintenanceInvoiceFormService: MaintenanceInvoiceFormService,
    private widgetNoteService: WidgetNoteService,
    private complianceService: ComplianceService,
    private complianceFormService: ComplianceFormService,
    private stepService: StepService
  ) {}

  ngOnInit(): void {
    this.widgetPTService
      .getPTWidgetStateByType<
        | IMaintenanceInvoice[]
        | InspectionSyncData[]
        | InvoiceDataReq[]
        | PtNote[]
      >(mapComponentToPTState[this.currentStep.componentType])
      .subscribe((res) => {
        this.listWidgets = res;
      });
  }

  handleOpenWidget = () => {
    this.stepService.setCurrentStep(null);
    const widgetData = this.listWidgets?.find(
      (item) =>
        (item?.syncStatus === ESyncStatus.COMPLETED || item.isSuccessful) &&
        this.currentStep?.widgetData?.id === item.id
    ) as any;
    switch (this.currentStep.componentType) {
      case EPropertyTreeButtonComponent.NOTE:
        this.widgetNoteService.isEditNote.next(true);
        this.widgetNoteService.updateWidgetNoteResponseData(widgetData);
        break;
      case EPropertyTreeType.CREDITOR_INVOICE:
        this.creditorInvoicingPropertyService.setSelectedCreditorInvoice(
          widgetData
        );
        break;
      case EPropertyTreeType.TENANCY_INVOICE:
        this.tenancyInvoiceService.setSelectedTenancyInvoice(widgetData);
        break;
      case EPropertyTreeType.MAINTENANCE_INVOICE:
        this.maintenanceInvoiceFormService.setSelectedMaintenanceInvoice(
          widgetData
        );
        break;
      case EPropertyTreeType.INGOING_INSPECTION:
        this.ingoingInspectionSyncService.setSelectedIngoingInspection(
          widgetData
        );
        break;
      case EPropertyTreeType.ROUTINE_INSPECTION:
        this.routineInspectionSyncService.setSelectedRoutineInspection(
          widgetData
        );
        break;
      case EPropertyTreeType.OUTGOING_INSPECTION:
        this.outgoingInspectionSyncService.setSelectedOutgoingInspection(
          widgetData
        );
        break;
      case EPropertyTreeType.COMPLIANCE:
        this.complianceService.showPopup$.next(
          ESelectOpenComplianceItemPopup.SYNC_COMPLIANCE
        );
        this.complianceFormService.patchFormCompliance(widgetData);
        const complianceControl = this.complianceFormService.complianceForm.get(
          'complianceItemControl'
        );
        widgetData?.idUserPropertyGroup
          ? complianceControl.disable()
          : complianceControl.enable();
        this.complianceService.currentDataEdit.next(widgetData);
        this.complianceFormService.complianceForm.markAsPristine();
        this.complianceFormService.complianceForm.markAsUntouched();
        break;
    }
    this.widgetPTService.setPopupWidgetState(
      this.currentStep.componentType === EPropertyTreeType.COMPLIANCE
        ? EPropertyTreeType.SYNC_COMPLIANCE
        : (this.currentStep.componentType as
            | EPropertyTreeType
            | EPropertyTreeOption)
    );
  };

  get hasWidgetDataDescription() {
    return Object.values(this.currentStep.widgetData)?.every(
      (x) => x !== null && x !== ''
    );
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
