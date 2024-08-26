import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgSelectComponent } from '@ng-select/ng-select';
import dayjs from 'dayjs';
import { ToastrService } from 'ngx-toastr';
import {
  combineLatest,
  distinctUntilChanged,
  finalize,
  lastValueFrom,
  map,
  of,
  Subject,
  switchMap,
  takeUntil
} from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { GeneralComplianceAPIService } from '@/app/general-compliance/services/general-compliance-api.service';
import {
  getCreditorName,
  getSupplierId
} from '@/app/invoicing/tenancy-invoicing/utils/functions';
import {
  IDocuments,
  InvoiceType,
  PropertyTreeAccount
} from '@/app/invoicing/tenancy-invoicing/utils/invoiceTypes';
import {
  FILE_VALID_INVOICE,
  FILE_VALID_TYPE,
  READONLY_FILE,
  SHORT_ISO_DATE,
  TIME_FORMAT,
  UploadErrorMsg
} from '@services/constants';
import { CreditorInvoicingService } from '@services/creditor-invoicing.service';
import { FilesService } from '@services/files.service';
import { FileUploadService } from '@services/fileUpload.service';
import { PropertiesService } from '@services/properties.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { TenancyInvoicingService } from '@services/tenancy-invoicing.service';
import { TrudiService } from '@services/trudi.service';
import { UserService } from '@services/user.service';
import {
  EInvoiceType,
  EStatusPaid
} from '@shared/enum/creditor-invoicing.enum';
import { validateFileExtension } from '@shared/feature/function.feature';
import { IFileInvoice } from '@shared/types/task.interface';
import {
  EInvoiceStatus,
  EInvoiceTypeBS,
  InvoiceDataReq
} from '@shared/types/tenancy-invoicing.interface';
import { Personal } from '@shared/types/user.interface';
import { SmokeAlarmAPIService } from '@/app/smoke-alarm/services/smoke-alarm-api.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import {
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { TenantVacateApiService } from '@/app/tenant-vacate/services/tenant-vacate-api.service';
import { fileLimit } from 'src/environments/environment';
import { TenancyInvoiceFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/tenancy-invoice-form.service';
import { TenancyInvoiceService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/tenancy-invoice.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { InvoiceWidgetComponent } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/invoice-widget/invoice-widget.component';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';

import uuid4 from 'uuid4';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import {
  calculateGSTFromPreTaxExpense,
  calculateGSTFromTotalExpense,
  convertStringToNumber,
  formatNumber,
  reformatNumberInput
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/utils/gst-calculating';
@Component({
  selector: 'tenancy-invoice-popup',
  templateUrl: './tenancy-invoice-popup.component.html',
  styleUrls: ['./tenancy-invoice-popup.component.scss']
})
export class TenancyInvoicePopupComponent
  extends InvoiceWidgetComponent
  implements OnInit
{
  @ViewChild('inputUploadfileTenant') private inputUploadfileTenant: ElementRef;
  @ViewChild('documentSelect') documentSelect: NgSelectComponent;
  public currentData: InvoiceDataReq;
  public listTenancies: Personal[];
  public listAccount: any[];
  public unsubscribe = new Subject<void>();
  public saveUrlEmbed: string;
  public isDisplayCheckbox: boolean = false;
  public ESyncPropertyTree = ESyncStatus;
  public disableSyncBtn = false;
  public readonlyTenancy = false;
  public invoiceDocuments: IDocuments[] = [];
  public syncStatus = ESyncStatus.NOT_SYNC;
  public isShowWarnCancel: boolean = false;
  public lastTimeSynced: string | Date;
  public prevData: InvoiceDataReq = null;
  public override syncPropertyTree = ESyncStatus;
  public isEditInvoice: boolean = true;
  public status: EInvoiceStatus;
  public statusTenancy: EInvoiceStatus;
  public statusCreditor: EInvoiceStatus;
  public selectedType: InvoiceType = InvoiceType.TenancyInvoice;
  public isCreditor: boolean = false;
  public isLinkInvoice: boolean = false;
  public isCreditorInvoice: boolean = false;
  public canEdit: boolean = true;
  public isDisabled: boolean = false;
  public listSupplier: any[];
  maxNumber = 13;
  public selectedTenancyId: Personal;
  public selectedAccount;
  public selectedCreditor;
  public searchNameDocument = '';
  public currentAgencyId: string;
  public currentFileSelected;

  readonly INVOICE_STATUS = EStatusPaid;
  readonly TIME_FORMAT = TIME_FORMAT;
  readonly SYNCTYPE = ESyncStatus;
  readonly EInvoiceStatus = EInvoiceStatus;
  public popupState = {
    showPopupTenancyInvoice: false,
    showPopupCancelInvoice: false
  };
  readonly FILE_VALID_TYPE = FILE_VALID_TYPE;
  public accepTypeFile = FILE_VALID_INVOICE;
  public listFileLocal = [];
  readonly errorFileMessage = UploadErrorMsg;
  public currentPM = {
    firstName: '',
    lastName: ''
  };
  public loading = {
    listAccount: false,
    listInvoice: false
  };
  public isUpdateTenancyInvoiceModal: boolean = false;
  public isConsole: boolean;
  public modalId = StepKey.propertyTree.tenancyInvoice;

  invoiceDataLookup = {};
  isArchiveMailbox: boolean;
  private isInclAmountEdittedLast: boolean = true;

  get readonly() {
    return this.invoiceFormService.readonly;
  }
  get isUpLoadFile() {
    return this.invoiceFormService.isUploadFile;
  }
  get tenancyInvocingForm() {
    return this.invoiceFormService?.invoiceForm;
  }
  get isUpLoad() {
    return this.tenancyInvocingForm.get('isUpLoad');
  }
  get invoiceDocument() {
    return this.tenancyInvocingForm?.get('invoiceDocument');
  }
  get tenantInvoiceForm() {
    return this.tenancyInvocingForm?.get('tenantInvoice');
  }
  get tenancy() {
    return this.tenantInvoiceForm?.get('tenancy');
  }
  get invoiceDescription() {
    return this.tenantInvoiceForm?.get('invoiceDescription');
  }
  get dueDate() {
    return this.tenantInvoiceForm?.get('dueDate');
  }
  get account() {
    return this.tenantInvoiceForm?.get('account');
  }
  get excludingGST() {
    return this.tenantInvoiceForm?.get('excludingGST');
  }
  get includingGST() {
    return this.tenantInvoiceForm?.get('includingGST');
  }
  get gstAmount() {
    return this.tenantInvoiceForm?.get('gstAmount');
  }

  get sendEmailTenancyInvoice() {
    return this.tenantInvoiceForm?.get('sendEmailTenancyInvoice');
  }

  get totalGSTByDefaultPercent() {
    return this.excludingGST.value
      ? String(
          (Number(this.excludingGST.value) *
            this.invoiceFormService.GSTPercent) /
            100
        )
      : '';
  }

  constructor(
    public stepService: StepService,
    public override taskService: TaskService,
    public agencyService: AgencyService,
    public sanitizer: DomSanitizer,
    public widgetPTService: WidgetPTService,
    public override tenancyInvoicingService: TenancyInvoiceService,
    public override trudiService: TrudiService,
    public override creditorInvoicingService: CreditorInvoicingService,
    public override smokeAlarmAPIService: SmokeAlarmAPIService,
    public override tenancyInvoiceService: TenancyInvoicingService,
    public override generalComplianceAPIService: GeneralComplianceAPIService,
    public override tenantVacateApiService: TenantVacateApiService,
    private propertiesService: PropertiesService,
    private invoiceFormService: TenancyInvoiceFormService,
    private fileService: FilesService,
    private toastService: ToastrService,
    private fileUpload: FileUploadService,
    private userService: UserService,
    private inboxService: InboxService,
    protected cdr: ChangeDetectorRef,
    private showSidebarRightService: ShowSidebarRightService,
    private agencyDateFormatService: AgencyDateFormatService,
    private sharedService: SharedService,
    private preventButtonService: PreventButtonService
  ) {
    super(
      taskService,
      tenancyInvoicingService,
      trudiService,
      creditorInvoicingService,
      smokeAlarmAPIService,
      tenancyInvoiceService,
      generalComplianceAPIService,
      tenantVacateApiService
    );
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.invoiceFormService.buildForm();
    this.getSenderList();
    this.handlePopupState({
      showPopupTenancyInvoice: true,
      showPopupCancelInvoice: false
    });

    this.propertiesService.peopleList$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((people) => {
        if (people) {
          this.listTenancies = people?.tenancies;
        }
      });

    this.getInvoiceDocument();

    this.taskService.currentTask$
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((data) => {
          if (data) {
            this.loading.listAccount = true;
            this.currentAgencyId = data.agencyId;
            if (!data.property?.isTemporary) {
              return this.tenancyInvoicingService.getListSupplierById(
                EInvoiceType.TENANCY_INVOICE,
                this.currentAgencyId
              );
            }
            return of(null);
          }
          return of(null);
        }),
        finalize(() => (this.loading.listAccount = false))
      )
      .subscribe((data: PropertyTreeAccount[]) => {
        if (data) {
          this.listAccount = data;
          this.loading.listAccount = false;
        }
      });

    this.invoiceFormService.selectedDocumentBS
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        if (!this.isEditInvoice) {
          this.saveUrlEmbed = value?.pdfUrl || '';
        }
        if (this.invoiceDocument?.value) {
          const prefillFormData = this.invoiceFormService?.prefillFormData();
          this.tenantInvoiceForm.patchValue(prefillFormData);
        }
      });

    this.tenancyInvoicingService
      .getSelectedTenancyInvoice()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (data?.id) {
          if ('syncStatus' in data) {
            this.setValueFormTenancyInvoice(data);
            this.prevData = data;
            this.isEditInvoice = true;
            this.syncStatus = data?.syncStatus;
            this.lastTimeSynced = data?.syncDate;
            this.status = data?.tenancyInvoice?.status;
            this.statusTenancy = data?.tenancyInvoice?.status;
            this.isLinkInvoice = data?.isLinkInvoice;
            this.checkEnableSyncBtn(this.status);
            this.handleDisableField(data);
            this.widgetPTService.setTenanciesID(
              data?.tenancyInvoice?.tenancyId
            );
          } else {
            this.isEditInvoice = false;
            this.resetForm();
          }

          this.tenancyInvocingForm.markAsUntouched();
          this.tenancyInvocingForm.markAsPristine();
        } else {
          this.resetForm();
          this.isEditInvoice = false;
        }
        const { DATE_FORMAT_DAYJS } =
          this.agencyDateFormatService.dateFormat$.getValue();
        const { tenancyInvoice, invoiceDocument } = data || {};
        const { amount, salesTax, dueDate, sendEmailTenancyInvoice } =
          tenancyInvoice || {};
        this.sendEmailTenancyInvoice.setValue(sendEmailTenancyInvoice);
        const checkExistedFile = this.invoiceDocuments?.some(
          (item) => item?.pdfUrl === data?.invoiceDocument?.url
        );
        const mapFile = {
          ...data,
          totalAmount: this.convertToDecimalNumber(
            Number(amount) - Number(salesTax)
          ),
          gstAmount: this.convertToDecimalNumber(salesTax),
          pdfName: invoiceDocument?.name,
          dueDate,
          pdfUrl: invoiceDocument?.url,
          subTitle: getCreditorName(
            this.currentPM?.firstName,
            this.currentPM?.lastName
          ),
          created: dayjs.utc(data?.createdAt).format(DATE_FORMAT_DAYJS),
          icon: this.mapFileIcon(invoiceDocument?.name)
        } as IDocuments;
        if (
          !checkExistedFile &&
          Object.keys(data || {}).length &&
          Object.values(invoiceDocument || {}).every((v) => v !== '')
        ) {
          this.invoiceDocuments = [...this.invoiceDocuments, mapFile];
        }
      });

    this.tenancyInvocingForm.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((change) => {
        this.checkChangesValues();
      });

    this.widgetPTService
      .getModalUpdate()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isUpdateTenancyInvoiceModal = res;
      });

    this.excludingGST.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        const reformatted = reformatNumberInput(res);
        this.excludingGST.setValue(reformatted);
      });

    this.includingGST.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        const reformatted = reformatNumberInput(res);
        this.includingGST.setValue(reformatted);
      });

    this.gstAmount.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        const reformatted = reformatNumberInput(res);
        this.gstAmount.setValue(reformatted);
      });
  }

  private getInvoiceDocument() {
    combineLatest([
      this.conversationAttacments(),
      this.invoiceFormService.creditorOptions
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([files, creditorOptions]) => {
        this.invoiceDocuments = files.map((file) => ({
          ...file,
          supplierId: getSupplierId(file.user.id, creditorOptions)
        })) as IDocuments[];
      });
  }

  private conversationAttacments() {
    return this.fileService.getAttachmentFilesDocument().pipe(
      map(
        (attachments) =>
          attachments?.reduce(
            (file, attachment) => [
              ...file,
              ...(attachment?.propertyDocuments || [])
            ],
            []
          ) || []
      ),
      map((files) =>
        files.filter(
          (file) =>
            file && this.fileService.getFileExtension(file.name) == '.pdf'
        )
      ),
      map((files) =>
        files.map((file) => ({
          id: file.id,
          pdfName: file.name,
          pdfUrl: file.mediaLink,
          created: file.createdAt,
          user: file.user,
          subTitle: getCreditorName(file.user?.firstName, file.user?.lastName),
          fileType: READONLY_FILE.pdf,
          icon: this.mapFileIcon(file.name)
        }))
      )
    );
  }

  private async getInvoiceData(fileUrl: string) {
    try {
      const { DATE_FORMAT_DAYJS } =
        this.agencyDateFormatService.dateFormat$.getValue();
      const cacheInvoice = this.invoiceDataLookup[fileUrl];

      if (cacheInvoice) return cacheInvoice;

      const invoiceData = ((await lastValueFrom(
        this.propertiesService.detectDataInvoice(fileUrl)
      )) || {}) as IFileInvoice;

      if (!invoiceData) return;

      invoiceData.created = dayjs
        .utc(invoiceData.created)
        .format(DATE_FORMAT_DAYJS);
      this.invoiceDataLookup[fileUrl] = invoiceData;

      return invoiceData;
    } catch (error) {
      console.error(error);
    }
  }

  convertToDecimalNumber(number) {
    if (!number) return;
    return number.toLocaleString('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  checkChangesValues() {
    if (
      (this.isEditInvoice &&
        this.tenancyInvocingForm.dirty &&
        this.syncStatus === ESyncStatus.COMPLETED) ||
      this.syncStatus === ESyncStatus.FAILED
    ) {
      this.syncStatus = ESyncStatus.UN_SYNC;
      this.lastTimeSynced = new Date();
    }
  }

  formatDateISO(date) {
    return date ? dayjs(date).format(SHORT_ISO_DATE) : null;
  }

  toFixedFloat(value: string | number, number = 2) {
    if (!value) return '';
    return typeof value === 'string'
      ? Number(Number(value).toFixed(number))
      : Number(value.toFixed(number));
  }

  handleSearchInvoiceDocument(event) {
    this.searchNameDocument = event?.term;
  }
  handleClickOutSide() {
    this.searchNameDocument = '';
  }

  handleClearInvoiceDocument() {
    if (this.readonly) {
      this.tenancy.setValue('');
    }
    this.isDisplayCheckbox = false;
    this.dueDate.setValue('');
    this.gstAmount.setValue('');
    this.excludingGST.setValue('');
    this.includingGST.setValue('');
    this.searchNameDocument = '';
    this.saveUrlEmbed = null;
    this.currentFileSelected = null;
  }

  onSelectChangedTenancy(event: Personal) {
    this.selectedTenancyId = event;
  }

  setValueFormTenancyInvoice(value: InvoiceDataReq) {
    this.invoiceFormService.patchFormValues(value);
    this.currentData = value;

    this.currentFileSelected = {
      ...value?.invoiceDocument,
      pdfUrl: value?.invoiceDocument?.url,
      isPdf:
        this.fileService.getFileExtension(value?.invoiceDocument?.name) ==
        '.pdf'
    };

    this.saveUrlEmbed = value?.invoiceDocument?.url || '';
  }

  //Invoice already synced and link to another task
  get isOtherTaskInvoice() {
    return (
      !!this.currentData.tenancyInvoice?.ptId &&
      this.currentData.syncStatus === ESyncStatus.NOT_SYNC
    );
  }

  handleDisableField(value) {
    const statusTenancy = value?.tenancyInvoice?.status?.toUpperCase();

    if (
      (statusTenancy === EInvoiceStatus.UNPAID &&
        value?.syncStatus === ESyncStatus.COMPLETED) ||
      this.isOtherTaskInvoice
    ) {
      this.invoiceDocument.disable();
      this.tenancy?.disable();
    }

    if (
      [
        EInvoiceStatus.PAID,
        EInvoiceStatus.PARTPAID,
        EInvoiceStatus.CANCELLED
      ]?.includes(statusTenancy)
    ) {
      this.canEdit = false;
      this.tenancyInvocingForm?.disable();
    }
    if (
      [
        EInvoiceStatus.PAID,
        EInvoiceStatus.PARTPAID,
        EInvoiceStatus.CANCELLED
      ]?.includes(statusTenancy)
    ) {
      this.isDisabled = true;
    }
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  goBack() {
    this.handlePopupState({
      showPopupTenancyInvoice: true,
      showPopupCancelInvoice: false
    });
  }

  handleCancel(isCreditorInvoice: boolean) {
    this.isCreditorInvoice = isCreditorInvoice;
    this.handlePopupState({
      showPopupTenancyInvoice: false,
      showPopupCancelInvoice: true
    });
  }

  handleCancelOK() {
    const currentStep = this.stepService.currentPTStep.getValue();
    this.tenancyInvoicingService.updateListTenancyInvoice(
      {
        ...this.currentData,
        syncStatus: ESyncStatus.INPROGRESS,
        firstTimeSyncSuccess: false
      },
      this.currentData.id
    );
    const invoiceIds = this.isCreditorInvoice
      ? this.currentData?.creditorInvoice?.id
      : this.currentData?.tenancyInvoice?.id;
    const taskId = this.taskService.currentTaskId$.getValue();
    const payload = {
      taskId,
      agencyId: this.taskService.currentTask$.value.agencyId
    };
    this.tenancyInvoicingService.cancelInvoice(payload, invoiceIds).subscribe({
      next: (res) => {
        if (res) {
          this.tenancyInvoicingService.updateListTenancyInvoice(
            {
              ...res,
              firstTimeSyncSuccess: res.syncStatus !== ESyncStatus.FAILED
            },
            res.id
          );
          if (
            this.tenancyInvoicingService.isShowModalSync.getValue() &&
            this.tenancyInvoicingService?.selectedTenancyInvoice$?.getValue()
              ?.id === res?.id
          ) {
            this.tenancyInvoicingService.setSelectedTenancyInvoice(res);
          }

          const trudiResponeTemplate =
            this.trudiService.getTrudiResponse?.getValue();

          if (res?.syncStatus === this.syncPropertyTree.COMPLETED) {
            if (trudiResponeTemplate?.isTemplate) {
              this.stepService.updateButtonStatusTemplate(
                currentStep?.id,
                EPropertyTreeButtonComponent.TENANCY_INVOICE,
                currentStep
                  ? EButtonAction[currentStep?.action.toUpperCase()]
                  : EButtonAction.PT_NEW_COMPONENT,
                res?.id
              );
            } else {
              super.updateButtonStatus();
            }
          }
        }
      },
      error: (err) => {
        this.toastService.error(
          err?.error?.message || 'Unable to sync invoice'
        );
      }
    });
    this.onCancle();
  }

  onSelectChangedAccount(event) {
    this.selectedAccount = event;
    this.sendEmailTenancyInvoice.setValue(true);
    this.widgetPTService.setTenanciesID(event?.id);
  }

  onSelectChangedCreditor(event) {
    this.selectedCreditor = event;
  }

  async handleChangeInvoiceDocument(data) {
    try {
      if (!data?.pdfUrl) return;

      this.currentFileSelected = {
        ...data,
        isPdf: this.fileService.getFileExtension(data.pdfName) == '.pdf'
      };

      this.saveUrlEmbed = data?.pdfUrl || '';

      const invoiceData = (await this.getInvoiceData(data.pdfUrl)) || {};

      this.currentFileSelected = {
        ...this.currentFileSelected,
        ...invoiceData
      };

      if (this.currentFileSelected?.isInvoice) {
        this.isUpLoad.setValue(true);
        this.isDisplayCheckbox = true;
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.invoiceFormService.selectedDocumentBS.next(this.currentFileSelected);
    }
  }

  onCheckboxChange(event) {
    this.isUpLoad.setValue(event?.target?.checked);
  }

  removeValidators() {
    for (const key in this.invoiceFormService.invoiceForm.controls) {
      this.invoiceFormService.invoiceForm.get(key).clearValidators();
      this.invoiceFormService.invoiceForm.get(key).updateValueAndValidity();
    }
  }

  onCancle() {
    this.widgetPTService.setPopupWidgetState(null);
    this.tenancyInvoicingService.setSelectedTenancyInvoice(null);
    this.widgetPTService.setTenanciesID(null);
    this.invoiceFormService.selectedInvoiceType.next(null);
    this.invoiceFormService.invoiceData.next(null);
    this.tenancyInvoicingService.isShowModalSync.next(false);
    this.resetPopupState();
    this.widgetPTService.setModalUpdate(false);
    this.preventButtonService.deleteProcess(
      EButtonStepKey.TENANCY_INVOICE,
      EButtonType.STEP
    );
  }

  resetPopupState() {
    for (const key in this.popupState) {
      if (Object.prototype.hasOwnProperty.call(this.popupState, key)) {
        this.popupState[key] = false;
      }
    }
  }

  checkEnableSyncBtn(status: string) {
    if (
      (status?.toUpperCase() === EInvoiceStatus.UNPAID && this.completed) ||
      this.isOtherTaskInvoice
    ) {
      this.readonlyTenancy = true;
    } else {
      this.readonlyTenancy = false;
    }
  }

  handleBack() {
    if (this.isUpdateTenancyInvoiceModal) {
      this.widgetPTService.setPopupWidgetState(EPropertyTreeType.UPDATE_WIDGET);
      return;
    }
    this.tenancyInvoicingService.setSelectedTenancyInvoice(null);
  }

  handleSync() {
    if (this.isArchiveMailbox) return;
    const currentStep = this.stepService.currentPTStep.getValue();
    if (this.tenancyInvocingForm.invalid) {
      this.tenancyInvocingForm.markAllAsTouched();
      return;
    }
    this.showSidebarRightService.handleToggleSidebarRight(true);
    const {
      agencyId,
      propertyId,
      taskId,
      supplierId,
      isUpLoad,
      tenantInvoice
    } = this.invoiceFormService.generateTenancyInvoice();

    const file =
      this.prevData?.invoiceDocument ||
      this.invoiceFormService.selectedDocumentBS.value
        ? {
            name:
              this.invoiceFormService.selectedDocumentBS.getValue()?.pdfName ||
              this.invoiceFormService.invoiceData.value?.invoiceDocument
                ?.name ||
              '',
            url:
              this.invoiceFormService.selectedDocumentBS.getValue()?.pdfUrl ||
              this.invoiceFormService.invoiceData.value?.invoiceDocument?.url ||
              '',
            isUpload: !!isUpLoad
          }
        : {
            name: '',
            url: '',
            isUpLoad: false
          };

    const {
      account,
      amount,
      invoiceDescription,
      dueDate,
      tenancy,
      salesTax,
      sendEmailTenancyInvoice
    } = tenantInvoice || {};

    const newItem: InvoiceDataReq = {
      creditorInvoice: {},
      invoiceDocument: file,
      id: this.prevData ? this.prevData.id : uuid4(),
      isLinkInvoice: false,
      supplierId: supplierId,
      syncStatus: ESyncStatus.INPROGRESS,
      invoiceWidgetType: EInvoiceTypeBS.TENANCY,
      tenancyInvoice: {
        accountId: account,
        amount: amount,
        creditorReference: '',
        description: invoiceDescription,
        dueDate: dueDate,
        id: null,
        salesTax: salesTax,
        tenancyId: tenancy,
        status: this.status,
        sendEmailTenancyInvoice: sendEmailTenancyInvoice
      },
      createdAt: this.prevData?.createdAt
        ? this.prevData?.createdAt
        : new Date(),
      stepId: currentStep ? currentStep?.id : this.prevData?.stepId
    };

    this.tenancyInvoicingService.updateListTenancyInvoice(newItem, newItem.id);

    if (!this.isEditInvoice) {
      const payload = {
        agencyId: agencyId,
        taskId: taskId,
        propertyId: propertyId,
        invoice: this.invoiceFormService.generateInvoice(),
        stepId: currentStep ? currentStep?.id : this.prevData?.stepId
      };

      this.tenancyInvoicingService
        .syncTenancyInvoice(payload)
        .subscribe((res) => {
          this.tenancyInvoicingService.updateListTenancyInvoice(
            {
              ...res,
              firstTimeSyncSuccess:
                res.syncStatus !== this.syncPropertyTree.FAILED,
              createdAt: this.prevData?.createdAt
                ? this.prevData?.createdAt
                : new Date()
            },
            newItem.id
          );

          if (
            this.tenancyInvoicingService.isShowModalSync.getValue() &&
            this.tenancyInvoicingService?.selectedTenancyInvoice$?.getValue()
              ?.id === newItem?.id
          ) {
            this.tenancyInvoicingService.setSelectedTenancyInvoice(res);
          }
          const trudiResponeTemplate =
            this.trudiService.getTrudiResponse?.getValue();
          if (res?.syncStatus === this.syncPropertyTree.COMPLETED) {
            this._updateListOfTenant();
            if (trudiResponeTemplate?.isTemplate) {
              this.stepService.updateButtonStatusTemplate(
                res?.stepId,
                EPropertyTreeButtonComponent.TENANCY_INVOICE,
                currentStep
                  ? EButtonAction[currentStep?.action.toUpperCase()]
                  : EButtonAction.PT_NEW_COMPONENT,
                res?.id
              );
            } else {
              super.updateButtonStatus();
            }
          }
        });
    } else {
      const body = {
        agencyId: agencyId,
        taskId: taskId,
        propertyId: propertyId,
        invoice: this.invoiceFormService.generateInvoice(),
        stepId: currentStep ? currentStep?.id : this.prevData?.stepId
      };

      this.tenancyInvoicingService
        .updateTenancyInvoice(body, this.prevData.id)
        .subscribe((res) => {
          this.tenancyInvoicingService.updateListTenancyInvoice(
            {
              ...res,
              firstTimeSyncSuccess:
                res.syncStatus !== this.syncPropertyTree.FAILED,
              createdAt: this.prevData?.createdAt
                ? this.prevData?.createdAt
                : new Date()
            },
            this.prevData.id
          );

          if (
            this.tenancyInvoicingService.isShowModalSync.getValue() &&
            this.tenancyInvoicingService?.selectedTenancyInvoice$?.getValue()
              ?.id === res?.id
          ) {
            this.tenancyInvoicingService.setSelectedTenancyInvoice(res);
          }
          const trudiResponeTemplate =
            this.trudiService.getTrudiResponse?.getValue();
          if (
            trudiResponeTemplate?.isTemplate &&
            res?.syncStatus === this.syncPropertyTree.COMPLETED
          ) {
            this.stepService.updateButtonStatusTemplate(
              res?.stepId,
              EPropertyTreeButtonComponent.TENANCY_INVOICE,
              currentStep
                ? EButtonAction[currentStep?.action.toUpperCase()]
                : EButtonAction.PT_NEW_COMPONENT,
              res?.id
            );
          }
          if (res?.syncStatus === this.syncPropertyTree.COMPLETED) {
            this._updateListOfTenant();
            if (!this.currentData?.tenancyInvoice?.status) {
              super.updateButtonStatus();
            }
          }
        });
    }
    this.onCancle();
  }

  private _updateListOfTenant() {
    const propertyId = this.propertiesService.currentPropertyId.getValue();
    this.propertiesService.getPeople(propertyId);
  }

  triggerUploadFile() {
    this.inputUploadfileTenant.nativeElement.click();
  }

  openUploadLocal(event) {
    const file = event.target.files[0] || {};
    const fileSizeMb = file.size / 1024 ** 2;
    const validFileType = validateFileExtension(
      file,
      FILE_VALID_INVOICE.map((item) => item.replace('.', ''))
    );
    let overFileSize = !(validFileType && fileSizeMb < fileLimit);
    if (!validFileType || overFileSize) {
      this.toastService.error(
        !validFileType
          ? this.errorFileMessage.INVALID_FILE
          : this.errorFileMessage.EXCEED_MAX_SIZE
      );
      return;
    }
    this.handleFileUpload(file);
  }

  private async handleFileUpload(file) {
    try {
      this.loading.listInvoice = true;
      const { name, type, size } = file || {};
      const infoLink = await this.fileUpload.uploadFile2(
        file,
        this.propertiesService.currentPropertyId.value
      );
      this.isDisplayCheckbox = true;
      const { DATE_FORMAT_DAYJS } =
        this.agencyDateFormatService.dateFormat$.getValue();
      const { firstName, lastName } = this.currentPM || {};
      const fileUploadLocal = {
        id: '',
        pdfName: name,
        size,
        fileType: type,
        pdfUrl: infoLink?.Location,
        user: {
          firstName,
          lastName
        },
        checked: false,
        icon: this.mapFileIcon(name),
        subTitle: getCreditorName(firstName, lastName),
        created: dayjs.utc(new Date()).toISOString()
      } as unknown as IDocuments;

      this.documentSelect.searchTerm = '';
      this.invoiceDocuments = [
        ...(this.invoiceDocuments || []),
        fileUploadLocal
      ];
      this.invoiceDocument.setValue(infoLink?.Location);
      this.handleChangeInvoiceDocument(fileUploadLocal);
      this.documentSelect.blur();
    } catch (error) {
      console.error(error);
    } finally {
      this.loading.listInvoice = false;
    }
  }

  getSenderList() {
    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.currentPM = {
            firstName: res?.firstName,
            lastName: res?.lastName
          };
        }
      });
  }

  mapFileIcon(fileName) {
    const fileExtension = this.fileService.getFileExtension(fileName);
    if (fileExtension === '.pdf') {
      return 'pdfInvoice';
    } else {
      return 'imageInvoice';
    }
  }

  onCloseInvoiceDocument() {
    this.searchNameDocument = '';
  }

  searchFn(searchText: string, item) {
    return (
      item.pdfName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.subTitle.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  resetForm() {
    this.tenancyInvocingForm.reset();
  }

  get propertyStreetLine() {
    return this.taskService.currentTask$.getValue()?.property?.streetline;
  }
  get propertyName() {
    return this.taskService.currentTask$.getValue()?.property
      ?.shortenStreetline;
  }
  get disabled() {
    return this.syncStatus === ESyncStatus.INPROGRESS;
  }
  get completed() {
    return this.syncStatus === ESyncStatus.COMPLETED;
  }
  get failed() {
    return this.syncStatus === ESyncStatus.FAILED;
  }

  get unsying() {
    return this.syncStatus === ESyncStatus.UN_SYNC;
  }

  triggerInputTouched(event: boolean, field: string) {
    if (!event) {
      this[field].markAsTouched();
    }
  }

  public onChangeDecimalNumber(field: string) {
    if (field === 'gstAmount') {
      if (!this.gstAmount.value) {
        this.includingGST.setValue(this.excludingGST.value);
      } else {
        const inclAmount = convertStringToNumber(this.includingGST.value);
        const exclAmount = convertStringToNumber(this.excludingGST.value);
        const gstAmount = convertStringToNumber(this.gstAmount.value);
        if (inclAmount && exclAmount && gstAmount <= exclAmount) {
          if (this.isInclAmountEdittedLast) {
            this.excludingGST.setValue(formatNumber(inclAmount - gstAmount));
          } else {
            this.includingGST.setValue(formatNumber(exclAmount + gstAmount));
          }
        }
      }
    }

    if (field === 'excludingGST') {
      this.isInclAmountEdittedLast = false;
      const amountExclGst = convertStringToNumber(this.excludingGST.value);
      const gstValue = calculateGSTFromPreTaxExpense(amountExclGst);
      this.gstAmount.setValue(formatNumber(gstValue));
      const amountInclGst =
        amountExclGst !== null ? formatNumber(amountExclGst + gstValue) : null;
      this.includingGST.setValue(amountInclGst);
    }

    if (field === 'includingGST') {
      this.isInclAmountEdittedLast = true;
      const amountInclGst = convertStringToNumber(this.includingGST.value);
      const gstValue = calculateGSTFromTotalExpense(amountInclGst);
      this.gstAmount.setValue(formatNumber(gstValue));
      const amountExclGst =
        amountInclGst !== null ? formatNumber(amountInclGst - gstValue) : null;
      this.excludingGST.setValue(amountExclGst);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.invoiceFormService.readonly = false;
    this.tenancyInvoicingService.isShowModalSync.next(false);
    this.invoiceFormService.isUploadFile = false;
    this.readonlyTenancy = false;
    this.removeValidators();
  }
}
