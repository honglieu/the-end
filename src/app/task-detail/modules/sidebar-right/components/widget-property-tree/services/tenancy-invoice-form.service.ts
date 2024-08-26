import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { TenancyInvoiceService } from './tenancy-invoice.service';
import {
  EInvoiceTypeBS,
  ICreditorInvoiceOption,
  InvoiceDataReq,
  InvoiceForm
} from '@shared/types/tenancy-invoicing.interface';
import { ShareValidators } from '@shared/validators/share-validator';
import { TaskStatusType } from '@shared/enum/task.enum';
import {
  IDocuments,
  InvoiceType
} from '@/app/invoicing/tenancy-invoicing/utils/invoiceTypes';
import { AgencyService } from '@services/agency.service';
import { TaskService } from '@services/task.service';
import { PropertiesService } from '@services/properties.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SharedService } from '@services/shared.service';
import { formatNumber } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/utils/gst-calculating';

@Injectable({
  providedIn: 'root'
})
export class TenancyInvoiceFormService {
  public invoiceForm: FormGroup;
  public invoiceFormStateBS = new BehaviorSubject(null);
  public invoiceFormState$ = this.invoiceFormStateBS.asObservable();
  public selectedDocumentBS = new BehaviorSubject<IDocuments>(null);
  public selectedInvoiceType = new BehaviorSubject<InvoiceType>(
    InvoiceType.TenancyInvoice
  );
  public invoiceData = new BehaviorSubject<InvoiceDataReq>(null);
  public readonly = false;
  public creditorOptions = new BehaviorSubject<ICreditorInvoiceOption[]>(null);
  public isUploadFile = false;
  public readonly GSTPercent = 10;
  public selectedTenancyInvoice$: BehaviorSubject<InvoiceForm> =
    new BehaviorSubject<InvoiceForm>(null);

  constructor(
    private formBuilder: FormBuilder,
    private tenancyInvoicingService: TenancyInvoiceService,
    private agencyService: AgencyService,
    public taskService: TaskService,
    public propertyService: PropertiesService,
    private sharedService: SharedService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  buildForm(): void {
    this.invoiceForm = this.formBuilder.group({
      invoiceType: new FormControl(InvoiceType.TenancyInvoice),
      invoiceDocument: new FormControl(''),
      isUpLoad: new FormControl(true),
      tenantInvoice: this.formBuilder.group(
        {
          tenancy: new FormControl('', [Validators.required]),
          invoiceDescription: new FormControl('', [Validators.required]),
          dueDate: new FormControl('', [Validators.required]),
          account: new FormControl('', [Validators.required]),
          sendEmailTenancyInvoice: new FormControl(true),
          excludingGST: new FormControl(null, [
            Validators.required,
            ShareValidators.greaterThanZero,
            Validators.maxLength(16),
            Validators.pattern('^[0-9]*(,[0-9]{3})*(.[0-9]{0,2})?$')
          ]),
          includingGST: new FormControl(null, [
            Validators.required,
            ShareValidators.greaterThanZero,
            Validators.maxLength(16),
            Validators.pattern('^[0-9]*(,[0-9]{3})*(.[0-9]{0,2})?$')
          ]),
          gstAmount: new FormControl(null, [
            Validators.min(0),
            Validators.maxLength(16),
            Validators.pattern('^[0-9]*(,[0-9]{3})*(.[0-9]{0,2})?$')
          ])
        },
        { validators: this.validateGstAmount(this.sharedService) }
      )
    });
  }

  generateTenancyInvoice() {
    const tenantInvoiceControl = this.invoiceForm.get('tenantInvoice');
    const gstAmount = Number(
      this.sharedService.removeCommaInNumber(
        tenantInvoiceControl.get('gstAmount').value
      )
    );
    const excludingGST = Number(
      this.sharedService.removeCommaInNumber(
        tenantInvoiceControl.get('excludingGST').value
      )
    );
    return {
      agencyId: this.taskService.currentTask$.getValue().agencyId,
      taskId: this.taskService.currentTaskId$.getValue(),
      propertyId: this.propertyService.currentPropertyId?.value,
      invoiceType: this.invoiceForm.get('invoiceType')?.value,
      invoiceDocument: this.invoiceForm.get('invoiceDocument').value,
      isUpLoad: this.invoiceForm.get('isUpLoad').value,
      supplierId: tenantInvoiceControl?.get('account')?.value,
      tenantInvoice: {
        sendEmailTenancyInvoice: tenantInvoiceControl.get(
          'sendEmailTenancyInvoice'
        ).value,
        isLinkInvoice: false,
        syncStatus: TaskStatusType.inprogress,
        tenancy: tenantInvoiceControl.get('tenancy').value || '',
        invoiceDescription:
          tenantInvoiceControl.get('invoiceDescription').value || '',
        dueDate: tenantInvoiceControl.get('dueDate').value || '',
        account: tenantInvoiceControl.get('account').value || '',
        excludingGST: tenantInvoiceControl.get('excludingGST').value || '',
        includingGST: tenantInvoiceControl.get('includingGST').value || '',
        gstAmount: tenantInvoiceControl.get('gstAmount').value || '',
        amount: this.toFixedFloat(gstAmount + excludingGST),
        salesTax: this.toFixedFloat(gstAmount)
      }
    };
  }

  generateInvoice() {
    const tenantInvoiceControl = this.invoiceForm.get('tenantInvoice');
    let tenancyInvoice = {};

    const file =
      this.invoiceData.value?.invoiceDocument?.url ||
      this.selectedDocumentBS.value ||
      this.invoiceForm.get('invoiceDocument').value
        ? {
            name:
              this.selectedDocumentBS.getValue()?.pdfName ||
              this.invoiceData.value?.invoiceDocument?.name,
            url:
              this.selectedDocumentBS.getValue()?.pdfUrl ||
              this.invoiceData.value?.invoiceDocument?.url ||
              this.invoiceForm.get('invoiceDocument')?.value,
            isUpload:
              (this.invoiceData.value?.invoiceDocument?.isUpload ||
                this.invoiceForm.get('isUpLoad').value) ??
              true
          }
        : {
            name: '',
            url: '',
            isUpLoad: false
          };

    const gstAmount = Number(
      this.sharedService.removeCommaInNumber(
        tenantInvoiceControl.get('gstAmount').value
      )
    );
    const excludingGST = Number(
      this.sharedService.removeCommaInNumber(
        tenantInvoiceControl.get('excludingGST').value
      )
    );
    tenancyInvoice = {
      accountId: tenantInvoiceControl?.get('account')?.value,
      amount: this.toFixedFloat(gstAmount + excludingGST),
      creditorReference: '',
      sendEmailTenancyInvoice:
        tenantInvoiceControl.get('sendEmailTenancyInvoice').value || false,
      description: tenantInvoiceControl.get('invoiceDescription').value,
      dueDate: this.formatDateISO(tenantInvoiceControl.get('dueDate').value),
      id: this.invoiceData?.value?.tenancyInvoice?.id,
      salesTax: this.toFixedFloat(gstAmount),
      tenancyId: tenantInvoiceControl.get('tenancy').value,
      status: this.invoiceData?.value?.tenancyInvoice?.status
    };

    const payload = {
      creditorInvoice: {},
      id: this.invoiceData?.value?.id ?? '',
      invoiceDocument: file,
      supplierId: tenantInvoiceControl?.get('account')?.value,
      invoiceWidgetType: EInvoiceTypeBS.TENANCY,
      isLinkInvoice: false,
      syncDate: String(new Date()),
      syncStatus: this.invoiceData?.value?.syncStatus ?? ESyncStatus.INPROGRESS,
      tenancyInvoice
    };
    return payload;
  }

  formatDateISO(date) {
    return date
      ? this.agencyDateFormatService.expectedTimezoneStartOfDay(date)
      : null;
  }

  prefillFormData() {
    const selectedDocument = this.selectedDocumentBS.getValue();
    const userInvoiceId = (selectedDocument as any)?.user?.id;

    const people = this.propertyService.peopleList?.value;
    const compareTenancies = people?.tenancies
      .filter((item) => {
        return item.userProperties.some(
          (userProp) => userProp.user.id === userInvoiceId
        );
      })
      .map((item) => item.id);
    const gstAmount =
      selectedDocument?.gstAmount && selectedDocument?.totalAmount
        ? formatNumber(selectedDocument.gstAmount)
        : null;
    const excludingGST = selectedDocument?.totalAmount
      ? formatNumber(selectedDocument?.totalAmount)
      : null;
    const preFilledValue = {
      dueDate: selectedDocument?.dueDate
        ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            selectedDocument?.dueDate
          )
        : null,
      gstAmount,
      excludingGST,
      includingGST: null
    };
    if (selectedDocument?.totalAmount && !selectedDocument?.gstAmount) {
      preFilledValue.gstAmount = formatNumber(
        (Number(preFilledValue.excludingGST) * this.GSTPercent) / 100
      );
    }
    if (
      preFilledValue.excludingGST !== null &&
      preFilledValue.gstAmount !== null
    ) {
      preFilledValue.includingGST = formatNumber(
        Number(preFilledValue.excludingGST) + Number(preFilledValue.gstAmount)
      );
    }

    if (compareTenancies[0]) {
      this.invoiceForm
        .get('tenantInvoice')
        ?.get('tenancy')
        .setValue(compareTenancies[0]);
      this.readonly = true;
    } else {
      this.readonly = false;
    }
    this.invoiceForm
      .get('tenantInvoice')
      .patchValue(preFilledValue, { emitEvent: false });
  }

  // custom validation
  validateGstAmount(service: SharedService) {
    return (group: FormGroup): ValidationErrors | null => {
      const excludingGST = group.get('excludingGST');
      const gstAmount = group.get('gstAmount');
      if (excludingGST && gstAmount) {
        const excludingGSTValue =
          typeof excludingGST.value === 'number'
            ? excludingGST.value
            : Number(service.removeCommaInNumber(excludingGST.value));
        const gstAmountValue =
          typeof gstAmount.value === 'number'
            ? gstAmount.value
            : Number(service.removeCommaInNumber(gstAmount.value));
        if (gstAmountValue > excludingGSTValue) {
          return { overGSTAmount: 'GST can not be greater than EXC GST' };
        }
      }
      return null;
    };
  }

  patchFormValues(customValue) {
    this.invoiceForm.patchValue({
      invoiceType: customValue?.invoiceWidgetType ?? '',
      invoiceDocument: customValue?.invoiceDocument?.url ?? '',
      isUpload: customValue?.invoiceDocument?.isUpload ?? false,
      tenantInvoice: {
        tenancy: customValue?.tenancyInvoice?.tenancyId ?? '',
        invoiceDescription: customValue?.tenancyInvoice?.description ?? '',
        dueDate:
          this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            customValue?.tenancyInvoice?.dueDate
          ) ?? '',
        account: customValue?.tenancyInvoice?.accountId ?? '',
        excludingGST:
          this.toFixedFloat(
            Number(customValue?.tenancyInvoice.amount) -
              Number(customValue?.tenancyInvoice.salesTax)
          )?.toLocaleString() ?? null,
        gstAmount:
          this.toFixedFloat(
            Number(customValue?.tenancyInvoice.salesTax)
          )?.toLocaleString() ?? null,
        includingGST:
          this.toFixedFloat(
            Number(customValue?.tenancyInvoice.amount)
          )?.toLocaleString() ?? null
      }
    });
  }

  toFixedFloat(value: string | number, number = 2) {
    if (!value) return '';
    return typeof value === 'string'
      ? Number(Number(value).toFixed(number))
      : Number(value.toFixed(number));
  }
}
