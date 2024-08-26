import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil, throttleTime } from 'rxjs';
import { PtNote } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/note/sync-note-popup/note-sync.interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import {
  PTWidgetDataField,
  mapComponentToTitle,
  mapComponentToTitleKey
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { mapComponentToPTState } from '@/app/task-detail/modules/steps/constants/constants';
import { IMaintenanceInvoice } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-invoice.interface';
import { InspectionSyncData } from '@shared/types/routine-inspection.interface';
import {
  EInvoiceTypeBS,
  InvoiceDataReq
} from '@shared/types/tenancy-invoicing.interface';
import {
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { EPropertyTreeButtonComponent } from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import dayjs from 'dayjs';
import { WidgetNoteService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-note.service';
import { CreditorInvoicingPropertyService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/creditor-invoice.service';
import { TenancyInvoiceService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/tenancy-invoice.service';
import { OutgoingInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/outgoing-inspection.service';
import { IngoingInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/ingoing-inspection.service';
import { RoutineInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/routine-inspection.service';
import { MaintenanceInvoiceFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-invoice-form.service';
import { ERentManagerType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ButtonKey, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
@Component({
  selector: 'update-pt-popup',
  templateUrl: './update-pt-popup.component.html',
  styleUrls: ['./update-pt-popup.component.scss']
})
export class UpdatePTPopupComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() type = 'default';
  @Output() onClose = new EventEmitter();
  public listSelect = [];
  private unsubscribe = new Subject<void>();
  public selectLabel: string;
  public searchValue: BehaviorSubject<string> = new BehaviorSubject(null);
  public notFoundItemText = 'No results found';
  public selectPTRequest: FormGroup;
  public loadingText = 'Loading...';
  public ptId: string;
  public loadingState = {
    listExistTask: false
  };
  public titlePT: string = '';
  public dataFieldWidget: PTWidgetDataField;
  public componentType:
    | EPropertyTreeButtonComponent
    | EPropertyTreeType
    | ERentManagerType;
  public dateFormatDay =
    this.agencyDateFormatService.dateFormat$.getValue().DATE_FORMAT_DAYJS;
  public modalId: string;

  constructor(
    private widgetPTService: WidgetPTService,
    public stepService: StepService,
    public widgetNoteService: WidgetNoteService,
    public creditorInvoicePropertyService: CreditorInvoicingPropertyService,
    public tenancyInvoiceService: TenancyInvoiceService,
    public outgoingInspectionSyncService: OutgoingInspectionSyncService,
    public ingoingInspectionSyncService: IngoingInspectionSyncService,
    public routineInspectionSyncService: RoutineInspectionSyncService,
    private maintenanceInvoiceFormService: MaintenanceInvoiceFormService,
    private agencyDateFormatService: AgencyDateFormatService,
    private preventButtonService: PreventButtonService
  ) {
    this.selectPTRequest = new FormGroup({
      selectExistUpdatePT: new FormControl(null, [Validators.required])
    });
  }

  ngOnInit(): void {
    this.stepService
      .getModalDataPT()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.modalId = mapComponentToTitleKey[res.componentType];
        this.titlePT = mapComponentToTitle[res.componentType];
        this.dataFieldWidget = mapComponentToPTState[res.componentType];
        this.componentType = res.componentType;
      });
    this.widgetPTService
      .getPTWidgetStateByType<
        | IMaintenanceInvoice[]
        | InspectionSyncData[]
        | InvoiceDataReq[]
        | PtNote[]
      >(this.dataFieldWidget)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          if (this.componentType === EPropertyTreeType.CREDITOR_INVOICE) {
            this.listSelect = (res as any)
              ?.filter(
                (invoice) =>
                  invoice?.invoiceWidgetType === EInvoiceTypeBS.CREDITOR &&
                  invoice?.syncStatus === ESyncStatus.COMPLETED
              )
              ?.map((creditor) => ({
                ...creditor,
                label: creditor?.creditorInvoice?.description || ''
              }));
          } else if (this.componentType === EPropertyTreeType.TENANCY_INVOICE) {
            this.listSelect = (res as any)
              ?.filter(
                (invoice) =>
                  invoice?.invoiceWidgetType === EInvoiceTypeBS.TENANCY &&
                  invoice?.syncStatus === ESyncStatus.COMPLETED
              )
              ?.map((tenancy) => {
                return {
                  ...tenancy,
                  label: tenancy?.tenancyInvoice?.description || ''
                };
              });
          } else {
            this.listSelect = (res as any)
              ?.filter((item) => item?.syncStatus === ESyncStatus.COMPLETED)
              .map((item) => {
                let label = '';

                switch (this.componentType) {
                  case EPropertyTreeType.MAINTENANCE_INVOICE:
                    label =
                      item?.data?.invoice?.creditorInvoice
                        ?.invoiceDescription || '';
                    break;
                  case EPropertyTreeType.ROUTINE_INSPECTION:
                  case EPropertyTreeType.INGOING_INSPECTION:
                  case EPropertyTreeType.OUTGOING_INSPECTION:
                    const tenancyName = item?.userPropertyGroup?.name || '';
                    const date =
                      this.agencyDateFormatService.formatTimezoneDate(
                        item?.startTime,
                        this.dateFormatDay
                      );
                    label = `${tenancyName} - ${date}`;
                    break;
                  default:
                    label = '';
                    break;
                }

                return {
                  ...item,
                  label: label
                };
              });
          }

          if (this.listSelect?.length === 1) {
            this.selectPTRequest
              .get('selectExistUpdatePT')
              .setValue(this.listSelect[0].id);
          }
        }
      });

    this.widgetPTService
      .getUpdatePTWidget()
      .pipe(takeUntil(this.unsubscribe), throttleTime(200))
      .subscribe((data) => {
        if (!data) return;
        for (const key in data) {
          this.selectPTRequest.get(key)?.setValue(data[key]);
        }
      });
  }

  getDisplayedData(item, componentType) {
    switch (componentType) {
      case EPropertyTreeType.CREDITOR_INVOICE:
        return {
          label: item?.creditorInvoice?.description || '',
          description:
            `Due date: ${dayjs(item?.creditorInvoice?.dueDate).format(
              this.dateFormatDay
            )}` || ''
        };
      case EPropertyTreeType.TENANCY_INVOICE:
        return {
          label: item?.tenancyInvoice?.description || '',
          description:
            `Due date: ${dayjs(item?.tenancyInvoice?.dueDate).format(
              this.dateFormatDay
            )}` || ''
        };
      case EPropertyTreeType.MAINTENANCE_INVOICE:
        return {
          label: item?.data?.invoice?.creditorInvoice?.invoiceDescription || '',
          description:
            `Due date: ${dayjs(
              item?.data?.invoice?.creditorInvoice?.dueDate
            ).format(this.dateFormatDay)}` || ''
        };
      case EPropertyTreeType.ROUTINE_INSPECTION:
      case EPropertyTreeType.INGOING_INSPECTION:
      case EPropertyTreeType.OUTGOING_INSPECTION:
        const tenancyName = item?.userPropertyGroup?.name || '';
        const date = dayjs(item?.startTime).format(this.dateFormatDay);
        const resultInspection = `${tenancyName} - ${date}`;
        return {
          label: resultInspection,
          description: ''
        };
      default:
        return { label: '', description: '' };
    }
  }

  handleCloseModal() {
    this.widgetPTService.setModalUpdate(false);
    this.visible = false;
    this.resetForm();
    this.onClose.emit();
    this.widgetPTService.setUpdatePTWidget(null);
    this.preventButtonService.deleteProcess(
      this.modalId as ButtonKey,
      EButtonType.STEP
    );
  }

  handleNext() {
    const selectedId = this.selectPTRequest?.get('selectExistUpdatePT').value;
    const nextData = this.listSelect.find(
      (item) => item.ptId === selectedId || item.id === selectedId
    );
    if (selectedId) {
      switch (this.componentType) {
        case EPropertyTreeType.CREDITOR_INVOICE:
          this.widgetPTService.setModalUpdate(true);
          this.creditorInvoicePropertyService.setSelectedCreditorInvoice(
            nextData
          );
          this.widgetPTService.setPopupWidgetState(
            EPropertyTreeType.CREDITOR_INVOICE
          );
          break;
        case EPropertyTreeType.TENANCY_INVOICE:
          this.widgetPTService.setPopupWidgetState(
            EPropertyTreeType.TENANCY_INVOICE
          );
          this.tenancyInvoiceService.setSelectedTenancyInvoice(nextData);
          this.widgetPTService.setModalUpdate(true);
          break;
        case EPropertyTreeType.MAINTENANCE_INVOICE:
          this.widgetPTService.setModalUpdate(true);
          this.widgetPTService.setPopupWidgetState(
            EPropertyTreeType.MAINTENANCE_INVOICE
          );
          this.maintenanceInvoiceFormService.setSelectedMaintenanceInvoice(
            nextData
          );
          break;
        case EPropertyTreeType.INGOING_INSPECTION:
          this.widgetPTService.setModalUpdate(true);
          this.ingoingInspectionSyncService.setSelectedIngoingInspection(
            nextData
          );
          this.widgetPTService.setPopupWidgetState(
            EPropertyTreeType.INGOING_INSPECTION
          );
          break;
        case EPropertyTreeType.ROUTINE_INSPECTION:
          this.widgetPTService.setModalUpdate(true);
          this.routineInspectionSyncService.setSelectedRoutineInspection(
            nextData
          );
          this.widgetPTService.setPopupWidgetState(
            EPropertyTreeType.ROUTINE_INSPECTION
          );
          break;
        case EPropertyTreeType.OUTGOING_INSPECTION:
          this.widgetPTService.setModalUpdate(true);
          this.outgoingInspectionSyncService.setSelectedOutgoingInspection(
            nextData
          );
          this.widgetPTService.setPopupWidgetState(
            EPropertyTreeType.OUTGOING_INSPECTION
          );
          break;
        default:
          break;
      }
    }

    if (this.listSelect?.length !== 1 && this.selectPTRequest?.invalid) {
      this.selectPTRequest.markAllAsTouched();
      return;
    }
    this.widgetPTService.setUpdatePTWidget({ ...this.selectPTRequest.value });
  }

  get selectExistControl() {
    return this.selectPTRequest.get('selectExistUpdatePT');
  }

  resetForm() {
    this.selectPTRequest?.reset();
  }

  ngBlur() {
    if (this.searchValue.value) this.searchValue.next('');
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
