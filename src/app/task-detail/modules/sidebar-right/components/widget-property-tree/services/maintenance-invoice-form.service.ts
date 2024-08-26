import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  type ValidationErrors
} from '@angular/forms';
import { IDocuments } from '@/app/invoicing/tenancy-invoicing/utils/invoiceTypes';
import { SharedService } from '@services/shared.service';
import { InvoiceForm } from '@shared/types/tenancy-invoicing.interface';
import { IInvoice } from '@shared/types/invoice.interface';
import { ShareValidators } from '@shared/validators/share-validator';
import {
  ICreditor,
  IMaintenanceInvoice
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-invoice.interface';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { convertUTCToLocalDateTime } from '@core';

@Injectable({
  providedIn: null
})
export class MaintenanceInvoiceFormService {
  public invoiceForm: FormGroup;
  public invoiceFormStateBS = new BehaviorSubject(null);
  public invoiceFormState$ = this.invoiceFormStateBS.asObservable();
  public selectedDocumentBS = new BehaviorSubject<IDocuments>(null);
  public creditorOptions = new BehaviorSubject<ICreditor[]>(null);
  public readonly = false;
  public maintananceInvoiceData = new BehaviorSubject<IInvoice>(null);
  public isDisplayCheckbox: boolean = false;
  public readonly GSTPercent = 10;
  public selectedMaintenanceInvoice$: BehaviorSubject<IMaintenanceInvoice> =
    new BehaviorSubject<IMaintenanceInvoice>(null);
  constructor(
    private formBuilder: FormBuilder,
    private shareService: SharedService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  buildForm(customValue?: InvoiceForm) {
    this.invoiceForm = this.formBuilder.group({
      invoiceType: new FormControl(
        customValue?.invoiceType ?? '',
        Validators.required
      ),
      invoiceDocument: new FormControl(customValue?.invoiceDocument ?? ''),
      isUploadFile: new FormControl(false),
      creditorInvoice: this.formBuilder.group(
        {
          creditor: new FormControl(
            customValue?.creditorInvoice?.creditor ?? null,
            [Validators.required]
          ),
          account: new FormControl(
            customValue?.creditorInvoice?.accountId ?? null,
            [Validators.required]
          ),
          invoiceDescription: new FormControl(
            customValue?.creditorInvoice?.invoiceDescription ?? '',
            [Validators.required, ShareValidators.trimValidator]
          ),
          invoiceREF: new FormControl(
            customValue?.creditorInvoice?.invoiceREF ?? '',
            [Validators.required, ShareValidators.trimValidator]
          ),
          dueDate: new FormControl(
            customValue?.creditorInvoice?.dueDate ?? '',
            [Validators.required]
          ),
          excludingGST: new FormControl(
            customValue?.creditorInvoice?.excludingGST ?? null,
            [
              Validators.required,
              ShareValidators.greaterThanZero,
              Validators.maxLength(16),
              Validators.pattern('^[0-9]*(,[0-9]{3})*(.[0-9]{0,2})?$')
            ]
          ),
          includingGST: new FormControl(
            customValue?.creditorInvoice?.includingGST ?? null,
            [
              Validators.required,
              ShareValidators.greaterThanZero,
              Validators.maxLength(16),
              Validators.pattern('^[0-9]*(,[0-9]{3})*(.[0-9]{0,2})?$')
            ]
          ),
          gstAmount: new FormControl(
            customValue?.creditorInvoice?.gstAmount ?? null,
            [
              Validators.min(0),
              Validators.maxLength(16),
              Validators.pattern('^[0-9]*(,[0-9]{3})*(.[0-9]{0,2})?$')
            ]
          )
        },
        { validators: this.validateGstAmount(this.shareService) }
      )
    });
  }

  generateInvoices() {
    const dataInvoice = this.selectedMaintenanceInvoice$.getValue()?.data;
    const creditorInvoiceControl = this.invoiceForm.get('creditorInvoice');
    const creditorInvoiceId =
      this.maintananceInvoiceData.value?.creditorInvoice?.invoiceId;
    const extension = (
      this.selectedDocumentBS.getValue()?.pdfUrl ||
      dataInvoice?.invoice?.file?.fileUrl
    )
      ?.split('.')
      ?.pop();
    const file =
      dataInvoice?.invoice?.file || this.selectedDocumentBS.value
        ? {
            fileName:
              this.selectedDocumentBS.getValue()?.pdfName ||
              dataInvoice?.invoice?.file?.fileName,
            fileUrl:
              this.selectedDocumentBS.getValue()?.pdfUrl ||
              dataInvoice?.invoice?.file?.fileUrl,
            extension: `application/${extension}`,
            isUploadFile: this.invoiceForm.get('isUploadFile').value || false,
            id:
              this.selectedDocumentBS.getValue()?.id ||
              dataInvoice?.invoice?.file?.id
          }
        : null;
    let creditorInvoice = {};
    const gstAmount = Number(
      this.shareService.removeCommaInNumber(
        creditorInvoiceControl.get('gstAmount').value
      )
    );
    const excludingGST = Number(
      this.shareService.removeCommaInNumber(
        creditorInvoiceControl.get('excludingGST').value
      )
    );
    creditorInvoice = {
      invoiceDescription:
        creditorInvoiceControl.get('invoiceDescription').value,
      dueDate: this.agencyDateFormatService.expectedTimezoneStartOfDay(
        creditorInvoiceControl.get('dueDate').value
      ),
      gstAmount: gstAmount,
      amount: excludingGST,
      creditorReference: creditorInvoiceControl.get('invoiceREF').value,
      accountId: creditorInvoiceControl?.get('account')?.value
    };
    if (creditorInvoiceId)
      creditorInvoice = { ...creditorInvoice, invoiceId: creditorInvoiceId };
    let payload = {
      supplierId: creditorInvoiceControl?.get('creditor')?.value,
      syncStatus: ESyncStatus.INPROGRESS,
      creditorInvoice,
      file: null
    };
    if (file) payload = { ...payload, file: file };
    return { ...payload };
  }

  // Fill data when user selected invoice file
  prefillFormData() {
    //TODO: prefill account when select file
    const selectedDocument = this.selectedDocumentBS.getValue();
    const gstAmount = Number(
      this.shareService.removeCommaInNumber(selectedDocument?.gstAmount)
    );
    const excludingGST = Number(
      this.shareService.removeCommaInNumber(selectedDocument?.totalAmount)
    );
    const dueDate = selectedDocument?.dueDate
      ? this.agencyDateFormatService.expectedTimezoneStartOfDay(
          selectedDocument?.dueDate
        )
      : '';
    const creditor = this.invoiceForm
      .get('creditorInvoice')
      .get('creditor').value;
    const preFilledValue = {
      creditor: selectedDocument?.supplierId || creditor,
      dueDate: dueDate,
      gstAmount:
        gstAmount > 0 && excludingGST ? gstAmount?.toLocaleString() : null,
      excludingGST: excludingGST > 0 ? excludingGST?.toLocaleString() : null,
      includingGST: null
    };
    if (selectedDocument?.totalAmount && !selectedDocument?.gstAmount) {
      preFilledValue.gstAmount = Number(
        this.shareService.removeCommaInNumber(
          String(
            (Number(selectedDocument?.totalAmount) * this.GSTPercent) / 100
          )
        )
      )?.toLocaleString();
    }
    if (
      preFilledValue.excludingGST !== null &&
      preFilledValue.gstAmount !== null
    ) {
      preFilledValue.includingGST = (
        Number(excludingGST) +
        Number(this.shareService.removeCommaInNumber(preFilledValue.gstAmount))
      )?.toLocaleString();
    }

    this.invoiceForm
      .get('creditorInvoice')
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

  setSelectedMaintenanceInvoice(data: IMaintenanceInvoice) {
    this.selectedMaintenanceInvoice$.next(data);
  }

  getSelectedMaintenanceInvoice(): Observable<IMaintenanceInvoice> {
    return this.selectedMaintenanceInvoice$.asObservable();
  }
  patchFormValues(customValue) {
    const tz = this.agencyDateFormatService.getCurrentTimezone();
    this.isDisplayCheckbox = customValue?.file ? true : false;
    this.invoiceForm.patchValue({
      invoiceType: customValue?.invoiceType ?? '',
      invoiceDocument: customValue?.file?.id ?? '',
      isUploadFile: customValue?.file?.isUploadFile ?? false,
      creditorInvoice: {
        creditor: customValue?.supplierId ?? '',
        account: customValue?.creditorInvoice?.accountId ?? '',
        invoiceDescription:
          customValue?.creditorInvoice?.invoiceDescription ?? '',
        invoiceREF: customValue?.creditorInvoice?.creditorReference ?? '',
        dueDate:
          convertUTCToLocalDateTime(
            customValue?.creditorInvoice?.dueDate,
            tz.value
          ) ?? '',
        excludingGST:
          this.toFixedFloat(Number(customValue?.creditorInvoice.amount)) ??
          null,
        gstAmount:
          this.toFixedFloat(Number(customValue?.creditorInvoice.gstAmount)) ??
          null,
        includingGST:
          this.toFixedFloat(
            Number(customValue?.creditorInvoice.amount) +
              Number(customValue?.creditorInvoice.gstAmount)
          ) ?? null
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
