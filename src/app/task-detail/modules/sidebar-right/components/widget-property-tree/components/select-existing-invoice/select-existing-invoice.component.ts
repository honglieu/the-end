import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  Subject,
  debounceTime,
  of,
  switchMap,
  takeUntil,
  distinctUntilChanged,
  tap,
  catchError
} from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { DEBOUNCE_DASHBOARD_TIME } from '@/app/dashboard/utils/constants';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { InvoiceDataReq } from '@shared/types/tenancy-invoicing.interface';
import {
  EPopupOption,
  ESelectInvoiceType,
  SELECT_INVOICE_LABEL
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/enum/popup.enum';
import { IMaintenanceInvoice } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-invoice.interface';
import {
  IInvoiceProperty,
  InvoiceApiService
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/invoice-api.service';
import { InvoicePopupManagerService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/invoice-popup-manager.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { EPropertyTreeType } from '@/app/task-detail/utils/functions';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
export type INextSelectInvoice =
  | {
      action:
        | ESelectInvoiceType.CREDITOR_INVOICE
        | ESelectInvoiceType.TENANCY_INVOICE;
      value?: InvoiceDataReq;
    }
  | {
      action: ESelectInvoiceType.MAINTENANCE_INVOICE;
      value?: IMaintenanceInvoice;
    };

@Component({
  selector: 'select-existing-invoice',
  templateUrl: './select-existing-invoice.component.html',
  styleUrls: ['./select-existing-invoice.component.scss']
})
export class SelectExistingInvoiceComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() invoiceType: ESelectInvoiceType;
  @Input() visible = false;
  @Output() next = new EventEmitter<INextSelectInvoice>();
  @Output() cancel = new EventEmitter();
  public readonly POPUP_OPTION = EPopupOption;
  public readonly ESelectInvoiceType = ESelectInvoiceType;
  public checkboxList = [];
  public title = '';
  public invoices: IInvoiceProperty[] = [];
  public dateFormatPipe: string;
  public searchText = new BehaviorSubject<string>('');
  public currentPropertyId;
  public currentTaskId;
  private destroy$ = new Subject();
  private loading: boolean;
  private isDisable: boolean;
  public modalId = null;
  public buttonKey;
  constructor(
    private invoicePopupService: InvoicePopupManagerService,
    private invoiceApiService: InvoiceApiService,
    private taskService: TaskService,
    private agencyDateFormatService: AgencyDateFormatService,
    private toastService: ToastrService,
    private stepService: StepService,
    private trudiService: TrudiService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['invoiceType']?.currentValue) {
      this.modalId =
        this.invoiceType === ESelectInvoiceType.CREDITOR_INVOICE
          ? StepKey.propertyTree.creditorInvoice
          : this.invoiceType === ESelectInvoiceType.TENANCY_INVOICE
          ? StepKey.propertyTree.tenancyInvoice
          : StepKey.propertyTree.maintainaceInvoice;
      this.buttonKey =
        this.invoiceType === ESelectInvoiceType.CREDITOR_INVOICE
          ? EButtonStepKey.CREDITOR_INVOICE
          : this.invoiceType === ESelectInvoiceType.TENANCY_INVOICE
          ? EButtonStepKey.TENANCY_INVOICE
          : EButtonStepKey.MAINTENANCE_INVOICE;
      const { title, checkboxList } = this.getPopupLabel(
        changes['invoiceType'].currentValue
      );
      this.title = title;
      this.checkboxList = checkboxList;
    }
  }

  ngOnInit(): void {
    const { id, property } = this.taskService.currentTask$.getValue();
    this.currentTaskId = id;
    this.currentPropertyId = property?.id;
    this.invoicePopupService.currentPopup$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((popup) => {
          if (popup) {
            return this.searchText.pipe(
              distinctUntilChanged(),
              tap(() => {
                this.loading = true;
              }),
              debounceTime(DEBOUNCE_DASHBOARD_TIME),
              switchMap((value) => {
                this.invoices = [];
                return this.invoiceApiService
                  .getAllInvoiceByProperty({
                    taskId: id,
                    invoiceType: popup,
                    propertyId: property.id,
                    search: value
                  })
                  .pipe(
                    catchError((err) => {
                      return of([]);
                    })
                  )
                  .pipe(
                    tap(() => {
                      this.loading = false;
                    })
                  );
              })
            );
          } else {
            return of([]);
          }
        })
      )
      .subscribe((listInvoice) => {
        this.invoices = listInvoice.map((item) => {
          return {
            ...item,
            linkedInvoiceValue: item.linkedInvoiceId ?? item.id
          };
        });
      });

    this.agencyDateFormatService.dateFormatPipe$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.dateFormatPipe = rs;
      });
  }

  getPopupLabel(invoiceType: ESelectInvoiceType) {
    if (!invoiceType) return {};
    return {
      checkboxList: [
        {
          value: EPopupOption.CREATE_NEW,
          label: SELECT_INVOICE_LABEL[invoiceType][EPopupOption.CREATE_NEW]
        },
        {
          value: EPopupOption.SELECT_EXISTING,
          label: SELECT_INVOICE_LABEL[invoiceType][EPopupOption.SELECT_EXISTING]
        }
      ],
      title: SELECT_INVOICE_LABEL[invoiceType].title
    };
  }

  handleCloseModal() {
    this.stepService.setCurrentPTStep(null);
    this.cancel.emit();
    this.preventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
  }

  handleNext() {
    const userChoice = this.userChoice.value;
    const invoiceId = this.selectedInvoice.value;
    if (userChoice === EPopupOption.CREATE_NEW) {
      this.next.emit({
        action: this.invoiceType,
        value: null
      });
    } else {
      const isValid = this.validateForm(userChoice, invoiceId);
      if (!isValid) {
        this.selectedInvoice.setErrors({
          required: true
        });
        this.selectedInvoice.markAsTouched();
      } else {
        this.isDisable = true;
        this.invoiceApiService
          .linkInvoiceToTask({
            taskId: this.currentTaskId,
            invoiceId: invoiceId,
            isMaintenanceInvoice:
              this.invoiceType === ESelectInvoiceType.MAINTENANCE_INVOICE
          })
          .subscribe({
            next: (rs) => {
              this.toastService.success(`${this.title} assigned to task`);
              this.markStepComplete(rs?.id);
              this.stepService.setCurrentPTStep(null);
              this.next.emit({
                action: this.invoiceType,
                value: rs
              });
            },
            error: () => {
              this.isDisable = false;
            },
            complete: () => {
              this.isDisable = false;
            }
          });
      }
    }
  }
  markStepComplete(widgetId: string) {
    const currentStep = this.stepService.currentPTStep.value;
    if (!currentStep) return;
    const isTemplate = this.trudiService.getTrudiResponse.value?.isTemplate;
    const isCompleted = currentStep.status === TrudiButtonEnumStatus.COMPLETED;

    const isCreateInvoiceStep =
      currentStep.action === EButtonAction.PT_NEW_COMPONENT &&
      [
        EPropertyTreeType.MAINTENANCE_INVOICE,
        EPropertyTreeType.TENANCY_INVOICE,
        EPropertyTreeType.CREDITOR_INVOICE
      ].includes(currentStep.componentType as EPropertyTreeType);
    if (isCreateInvoiceStep && isTemplate && !isCompleted) {
      this.stepService.updateButtonStatusTemplate(
        currentStep.id,
        currentStep.componentType as EPropertyTreeButtonComponent,
        EButtonAction.PT_NEW_COMPONENT,
        widgetId
      );
    }
  }

  public validateForm(userChoice: EPopupOption, invoiceId: string) {
    if (userChoice === EPopupOption.CREATE_NEW) return true;
    return !!invoiceId;
  }

  public get selectInvoiceForm() {
    return this.invoicePopupService.selectExistInvoiceForm;
  }

  get userChoice() {
    return this.selectInvoiceForm.get('userChoice');
  }

  get selectedInvoice() {
    return this.selectInvoiceForm.get('selectedInvoice');
  }

  ngOnDestroy() {
    this.stepService.setCurrentPTStep(null);
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
