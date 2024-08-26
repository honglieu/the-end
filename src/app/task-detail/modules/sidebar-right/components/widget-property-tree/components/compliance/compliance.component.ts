import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ComplianceApiService } from '@/app/compliance/services/compliance-api.service';
import { ComplianceFormService } from '@/app/compliance/services/compliance-form.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { EPropertyTreeType } from '@/app/task-detail/utils/functions';
import { ComplianceService } from '@/app/compliance/services/compliance.service';
import {
  ICategoryItem,
  IDataPopupCompliance
} from '@/app/compliance/utils/compliance.type';
import { Compliance } from '@shared/types/compliance.interface';
import {
  EComplianceType,
  ESelectRadioComplianceItemPopup
} from '@/app/compliance/utils/compliance.enum';
import { TaskNameId } from '@shared/enum/task.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CreditorInvoicingPropertyService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/creditor-invoice.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';

@Component({
  selector: 'compliance',
  templateUrl: './compliance.component.html',
  styleUrls: ['./compliance.component.scss']
})
export class ComplianceComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();
  public isShowSyncPopup: boolean;
  public popupState = {
    syncPopup: false,
    complianceItemPopup: false
  };
  public taskNameId: string;
  public arrComplianceItem;
  public isNextFromUpdateModal: boolean = false;
  public isShowSmokeAlarmField: boolean = false;
  public listCategoryByAgency: ICategoryItem[];
  public accountOptions = [];

  public typePopup: EPropertyTreeType;
  readonly propertyTreeType = EPropertyTreeType;
  public modalId = StepKey.propertyTree.createCompliance;

  constructor(
    public complianceApiService: ComplianceApiService,
    public complianceFormService: ComplianceFormService,
    public complianceService: ComplianceService,
    public widgetPTService: WidgetPTService,
    private propertyService: PropertiesService,
    public taskService: TaskService,
    public trudiService: TrudiService,
    public agencyService: AgencyService,
    public creditorServiceProperty: CreditorInvoicingPropertyService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    this.complianceFormService.initFormSyncCompliance();
    this.getListCompliance();
    this.widgetPTService
      .getPopupWidgetState()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        switch (res) {
          case EPropertyTreeType.SYNC_COMPLIANCE:
            this.handlePopupState({
              syncPopup: true,
              complianceItemPopup: true
            });
            break;
          case EPropertyTreeType.CREATE_COMPLIANCE:
            this.handlePopupState({
              syncPopup: false,
              complianceItemPopup: true
            });
            this.isNextFromUpdateModal = false;
            break;
          case EPropertyTreeType.UPDATE_COMPLIANCE:
            this.isNextFromUpdateModal = true;
            this.handlePopupState({
              syncPopup: false,
              complianceItemPopup: true
            });
            break;
          default:
            this.handlePopupState({
              syncPopup: false,
              complianceItemPopup: false
            });
            break;
        }
      });

    this.creditorServiceProperty
      .getAllSupplier()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.accountOptions = res;
        }
      });
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  onCancel() {
    this.handlePopupState({ syncPopup: false, complianceItemPopup: false });
    this.complianceFormService.complianceForm
      .get('complianceItemControl')
      .enable();
    this.isNextFromUpdateModal = false;
    this.widgetPTService.setPopupWidgetState(null);
    this.preventButtonService.deleteProcess(
      EButtonStepKey.COMPLIANCE,
      EButtonType.STEP
    );
  }

  public onCloseComplianceItemPopup() {
    this.handlePopupState({ complianceItemPopup: false });
    this.isNextFromUpdateModal = false;
    this.preventButtonService.deleteProcess(
      EButtonStepKey.COMPLIANCE,
      EButtonType.STEP
    );
  }

  public onNextComplianceItemPopup(data: IDataPopupCompliance) {
    this.complianceService.unSyncChangeStatus$.next(false);
    this.widgetPTService.setPopupWidgetState(EPropertyTreeType.SYNC_COMPLIANCE);
    const dataCompliance = data?.selectedComplianceItem;
    this.complianceService.currentDataEdit.next({} as Compliance);

    if (data?.typePopup === EPropertyTreeType.CREATE_COMPLIANCE) {
      const isExistedCompliance = !!Object.keys(
        data?.selectedComplianceItem || {}
      ).length;
      this.complianceService.setSelectComplianceTypeState(
        isExistedCompliance
          ? ESelectRadioComplianceItemPopup.SELECT_EXISTING
          : ESelectRadioComplianceItemPopup.CREATE_NEW
      );
      if (isExistedCompliance) {
        const complianceData = dataCompliance as ICategoryItem;
        const { compliance, id } = complianceData;
        this.complianceFormService.patchFormCompliance(compliance, id);
        this.complianceService.showSmokeType$.next(
          compliance.type === EComplianceType.SMOKE_ALARM
        );
        this.complianceService.complianceSelected.next(compliance);
      } else {
        this.complianceService.complianceSelected.next(null);
        this.complianceFormService.initFormSyncCompliance();
        this.complianceService.showSmokeType$.next(false);
      }
    } else {
      this.complianceService.currentDataEdit.next(dataCompliance);
      this.complianceFormService.patchFormCompliance(dataCompliance);
      this.complianceFormService.complianceForm
        .get('complianceItemControl')
        .disable();
    }

    this.complianceFormService.complianceForm.markAsPristine();
    this.complianceFormService.complianceForm.markAsUntouched();
  }

  getListCompliance() {
    let subscriber;
    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          const propertyId = res.property.id;
          const taskTypeId = res.taskNameRegion?.taskNameId;
          const taskId = res.id;
          this.taskNameId = taskTypeId;
          const agencyId = res.agencyId;
          let complianceType: EComplianceType;
          switch (taskTypeId) {
            case TaskNameId.generalCompliance:
              complianceType = EComplianceType.GENERAL;
              break;
            case TaskNameId.smokeAlarms:
              complianceType = EComplianceType.SMOKE_ALARM;
              break;
            default:
              complianceType = EComplianceType.OTHER;
          }
          if (!subscriber && !res.property?.isTemporary) {
            this.taskService
              .getComplianceList(
                complianceType,
                propertyId,
                agencyId,
                false,
                taskId
              )
              .subscribe((items) => {
                if (items) {
                  subscriber = true;
                  this.listCategoryByAgency = items;
                }
              });
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
