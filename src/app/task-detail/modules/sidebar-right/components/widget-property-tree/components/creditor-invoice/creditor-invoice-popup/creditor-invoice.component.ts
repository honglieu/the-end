import {
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  takeUntil
} from 'rxjs/operators';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { Subject, combineLatest, lastValueFrom, of } from 'rxjs';
import dayjs from 'dayjs';
import { TaskService } from '@services/task.service';
import { PropertiesService } from '@services/properties.service';
import {
  AMOUNT_EXCLUDING_EST,
  FILE_VALID_INVOICE,
  FILE_VALID_TYPE,
  MAX_INPUT_URL_LENGTH,
  READONLY_FILE,
  UploadErrorMsg
} from '@services/constants';
import { IFileInvoice } from '@shared/types/task.interface';
import { DomSanitizer } from '@angular/platform-browser';
import { EInvoice, EStatusPaid } from '@shared/enum/creditor-invoicing.enum';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { ToastrService } from 'ngx-toastr';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { PetRequestButton } from '@shared/types/trudi.interface';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { SupplierPT } from '@shared/types/user.interface';
import { CreditorInvoicingPropertyService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/creditor-invoice.service';
import {
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { NgSelectComponent } from '@ng-select/ng-select';
import uuid4 from 'uuid4';
import { TenancyInvoiceService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/tenancy-invoice.service';
import { CreditorInvoiceFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/creditor-invoice-form.service';
import {
  EInvoiceStatus,
  InvoiceDataReq
} from '@shared/types/tenancy-invoicing.interface';
import { CreditorInvoicingService } from '@services/creditor-invoicing.service';
import { TaskNameId } from '@shared/enum/task.enum';
import { GeneralComplianceAPIService } from '@/app/general-compliance/services/general-compliance-api.service';
import { SmokeAlarmAPIService } from '@/app/smoke-alarm/services/smoke-alarm-api.service';
import { TrudiService } from '@services/trudi.service';
import { TenancyInvoicingService } from '@services/tenancy-invoicing.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { InvoiceWidgetComponent } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/invoice-widget/invoice-widget.component';
import { TenantVacateApiService } from '@/app/tenant-vacate/services/tenant-vacate-api.service';
import { FilesService } from '@services/files.service';
import { fileLimit } from 'src/environments/environment';
import { FileUploadService } from '@services/fileUpload.service';
import { validateFileExtension } from '@shared/feature/function.feature';
import { UserService } from '@services/user.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { getCreditorName } from '@/app/invoicing/tenancy-invoicing/utils/functions';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { SharedService } from '@services/shared.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { EPaymentMethod, paymentMethodName } from '@shared/enum';
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
  selector: 'creditor-invoice-property-tree',
  templateUrl: './creditor-invoice.component.html',
  styleUrls: ['./creditor-invoice.component.scss']
})
export class CreditorInvoiceComponent
  extends InvoiceWidgetComponent
  implements OnInit
{
  @Input() isCreditorInvoice: boolean;
  @Input() showBackButton: boolean;
  @Input() model: PetRequestButton = null;
  @Output() onClose = new EventEmitter<boolean>();
  @Output() back = new EventEmitter();
  @ViewChild('selectElement') selectElement: NgSelectComponent;
  @ViewChild('inputUploadfile') private inputUploadfile: ElementRef;
  @ViewChild('invoiceSelect') invoiceSelect: NgSelectComponent;

  maxInputLength = MAX_INPUT_URL_LENGTH;
  maxInputLength20 = 20;
  maxNumber = 13;
  readonly SYNCTYPE = SyncMaintenanceType;
  readonly dateFormat$ = this.agencyDateFormatService.dateFormat$.getValue();
  readonly EInvoiceStatus = EInvoiceStatus;
  public currentData: InvoiceDataReq;
  public invoicePrefillValue: IFileInvoice;
  public listSupplier: any[];
  public listAccount: any[];
  private unsubscribe = new Subject<void>();
  public isShowFeildTenacy: boolean = false;
  public disableShowFieldTenancy: boolean = false;
  public isRequireDate: boolean = false;
  public isRequireDateTenant: boolean = false;
  public listofTenacyUser: any[];
  public trudiResponse;
  public saveUrlEmbed: string;
  public canEdit: boolean = true;
  public hasFooter: boolean = true;
  public isOnlySupplier: boolean = false;
  public isShowFile: boolean = false;
  public showPopupConfirm: boolean = false;
  public isShowPdf: boolean = false;
  public listInvoiceDocument = [];
  public isDisableFile: boolean = false;
  public isShowCancelCreditor: boolean;
  public isShowCancelTenancy: boolean;
  public ESTATUSPAID = EStatusPaid;
  public TYPE_SYNC_MAINTENANCE = SyncMaintenanceType;
  public isDisplayCheckbox: boolean = false;
  public crtSupplier: SupplierPT;
  public popupModalPosition = ModalPopupPosition;
  public isCreditorInvoce: boolean = false;
  public validateAmountNumberInput = AMOUNT_EXCLUDING_EST;
  public syncStatus: string = '';
  public syncDate: string = '';
  public isImage: boolean = false;
  public searchNameDocument: string = '';
  public override syncPropertyTree = ESyncStatus;
  public isTenancy: boolean;
  readonly FILE_VALID_TYPE = FILE_VALID_TYPE;
  public accepTypeFile = FILE_VALID_INVOICE;
  public listFileLocal = [];
  readonly errorFileMessage = UploadErrorMsg;
  readonly GSTPercent = 10;
  public currentPM = {
    firstName: '',
    lastName: ''
  };
  private currentAgencyId: string;
  public loading = {
    listInvoice: false
  };
  public isTaskTenant: boolean = false;
  public isConsole: boolean;
  public paymentMethod: string;
  public readonly EPaymentMethod = EPaymentMethod;
  private isInclGSTEdittedLast: boolean = true;
  private isSecondInclGSTEdittedLast: boolean = true;

  formValidate = {
    invoiceDocument: false,
    accountForm: false,
    creditor: false,
    account: false,
    property: false,
    description: false,
    descriptionTenacy: false,
    invoiceREF: false,
    amountExcludingGST: false,
    amountIncludingGST: false,
    gstAmount: false,
    amountExcludingGSTsecond: false,
    amountIncludingGSTsecond: false,
    gstAmountSecond: false,
    dueDate: false,
    accountTenancyInvoice: false,
    dateTenant: false,
    tenacyInvoice: false
  };

  public errors = {
    gstAmount: {
      hasError: false,
      msg: '',
      isTouching: false
    },
    amountExcludingGST: {
      hasError: false,
      msg: '',
      isTouching: false,
      isRequired: true
    },
    amountIncludingGST: {
      hasError: false,
      msg: '',
      isTouching: false,
      isRequired: true
    },
    amountExcludingGSTsecond: {
      hasError: false,
      msg: '',
      isTouching: false,
      isRequired: true
    },
    amountIncludingGSTsecond: {
      hasError: false,
      msg: '',
      isTouching: false,
      isRequired: true
    },
    gstAmountSecond: {
      hasError: false,
      msg: '',
      isTouching: false
    }
  };
  public isUpdateCreditorInvoiceModal: boolean = false;
  isArchiveMailbox: boolean;
  public modalId = StepKey.propertyTree.creditorInvoice;

  private invoiceDataLookup = {};

  constructor(
    public override tenancyInvoicingService: TenancyInvoiceService,
    public override creditorInvoicingService: CreditorInvoicingService,
    public override generalComplianceAPIService: GeneralComplianceAPIService,
    public override smokeAlarmAPIService: SmokeAlarmAPIService,
    public override trudiService: TrudiService,
    public override tenancyInvoiceService: TenancyInvoicingService,
    public override tenantVacateApiService: TenantVacateApiService,
    public override taskService: TaskService,
    public creditorInvoiceFormService: CreditorInvoiceFormService,
    public sanitizer: DomSanitizer,
    public agencyService: AgencyService,
    public widgetPTService: WidgetPTService,
    private propertyService: PropertiesService,
    private cdRef: ChangeDetectorRef,
    private creditorServiceProperty: CreditorInvoicingPropertyService,
    private toastService: ToastrService,
    private fileUpload: FileUploadService,
    private userService: UserService,
    private fileService: FilesService,
    public stepService: StepService,
    private inboxService: InboxService,
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
    this.getListAccount();
    this.getSenderList();
    this.creditorInvoiceFormService.initForm();
    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentTask) => {
        if (!currentTask) return;
        this.currentAgencyId = currentTask?.agencyId;
      });

    this.widgetPTService
      .getPTWidgetStateByType(PTWidgetDataField.TENANCY_INVOICES)
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((data) => {
          if (!data.length) return of(null);
          this.isTenancy = data.some(
            (item) =>
              item.invoiceWidgetType === EInvoice.TENANCY_INVOICE ||
              item.isLinkInvoice
          );
          return this.taskService.currentTask$;
        })
      )
      .subscribe((res) => {
        if (res) {
          const taskNameId = res.trudiResponse.setting?.taskNameId;
          if (this.isTenancy && taskNameId === TaskNameId.invoiceTenant) {
            this.disableShowFieldTenancy = true;
          }
        }
      });

    this.creditorServiceProperty
      .getListSupplier()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.listAccount = res;
        }
      });

    this.creditorServiceProperty
      .getAllSupplier()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.listSupplier = res;
          if (this.invoicePrefillValue) {
            this.setSupplierPT();
          }
        }
      });

    this.getInvoiceDocument();

    this.creditorServiceProperty.setTypeTaskInvoice
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.isShowFeildTenacy = true;
        }
      });

    this.handleGetListTenacy();

    this.widgetPTService
      .getModalUpdate()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isUpdateCreditorInvoiceModal = res;
      });

    this.creditor.valueChanges
      .pipe(takeUntil(this.unsubscribe), startWith(this.creditor.value))
      .subscribe((res) => {
        if (!res) return;
        const chosenCreditor = this.listSupplier.find((u) => u.id === res);
        if (!chosenCreditor) {
          this.paymentMethod = '';
          return;
        }
        const chosenPaymentMethod = chosenCreditor['creditorPaymentMethod']
          ?.toUpperCase()
          ?.trim();
        this.paymentMethod = paymentMethodName[chosenPaymentMethod];
      });

    this.amountExcludingGST.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        const reformatted = reformatNumberInput(res);
        this.checkError(reformatted, true, 'amountExcludingGST');
        this.amountExcludingGST.setValue(reformatted);
      });

    this.amountIncludingGST.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        const reformatted = reformatNumberInput(res);
        this.checkError(reformatted, true, 'amountIncludingGST');
        this.amountIncludingGST.setValue(reformatted);
      });

    this.gstAmount.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        const reformatted = reformatNumberInput(res);
        this.checkError(reformatted, false, 'gstAmount');
        this.gstAmount.setValue(reformatted);
      });

    this.amountExcludingGSTsecond.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        const reformatted = reformatNumberInput(res);
        this.checkError(reformatted, true, 'amountExcludingGSTsecond');
        this.amountExcludingGSTsecond.setValue(reformatted);
      });

    this.amountIncludingGSTsecond.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        const reformatted = reformatNumberInput(res);
        this.checkError(reformatted, true, 'amountIncludingGSTsecond');
        this.amountIncludingGSTsecond.setValue(reformatted);
      });

    this.gstAmountSecond.valueChanges
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        const reformatted = reformatNumberInput(res);
        this.checkError(reformatted, false, 'gstAmountSecond');
        this.gstAmountSecond.setValue(reformatted);
      });
  }

  private getInvoiceDocument() {
    combineLatest([
      this.creditorServiceProperty.getSelectedCreditorInvoice(),
      this.conversationAttacments()
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([selectedInvoice, files]) => {
        const { DATE_FORMAT_DAYJS } =
          this.agencyDateFormatService.dateFormat$.getValue();
        this.listInvoiceDocument = files.map((file) => ({
          ...file,
          created: file?.created,
          icon: this.mapFileIcon(file?.pdfName)
        }));

        const checkExistedFile = this.listInvoiceDocument?.some(
          (item) => item?.pdfUrl === selectedInvoice?.invoiceDocument?.url
        );

        const { amount, salesTax } = selectedInvoice?.creditorInvoice || {};
        const mapFile = {
          ...selectedInvoice,
          ...selectedInvoice?.creditorInvoice,
          totalAmount: this.convertToDecimalNumber(amount - salesTax),
          gstAmount: this.convertToDecimalNumber(salesTax),
          pdfName: selectedInvoice?.invoiceDocument?.name,
          pdfUrl: selectedInvoice?.invoiceDocument?.url,
          user: {
            firstName: this.currentPM?.firstName,
            lastName: this.currentPM?.lastName
          },
          icon: this.mapFileIcon(selectedInvoice?.invoiceDocument?.name),
          subTitle: getCreditorName(
            this.currentPM?.firstName,
            this.currentPM?.lastName
          ),
          created: selectedInvoice?.createdAt
        };
        if (
          !checkExistedFile &&
          Object.keys(selectedInvoice || {}).length &&
          selectedInvoice?.invoiceDocument
        ) {
          this.listInvoiceDocument = [...this.listInvoiceDocument, mapFile];
        }
        this.currentData = selectedInvoice;
        const { tenancyInvoice } = this.currentData || {};

        this.sendEmailTenancyInvoice.setValue(
          tenancyInvoice?.sendEmailTenancyInvoice
        );
        this.myForm.valueChanges
          .pipe(takeUntil(this.unsubscribe))
          .subscribe((change) => {
            if (
              this.myForm.dirty &&
              this.currentData &&
              (this.currentData?.syncStatus === ESyncStatus.COMPLETED ||
                this.currentData?.syncStatus === ESyncStatus.FAILED)
            ) {
              this.syncStatus = ESyncStatus.UN_SYNC;
              this.syncDate = new Date().toString();
            }
          });
        const currentSupplier = this.listSupplier.find(
          (item) => item.id === this.currentData?.supplierId
        );
        if (
          currentSupplier?.type === EConfirmContactType.SUPPLIER &&
          this.currentData?.syncStatus === ESyncStatus.COMPLETED
        ) {
          this.isOnlySupplier = true;
        }
        const accountSupplierId = this.listAccount.find(
          (e) => e.accountCode === currentSupplier?.accountCode
        )?.id;
        let accountId = this.currentData?.creditorInvoice?.accountId;
        let accountTenancyInvoiceId =
          this.currentData?.tenancyInvoice?.accountId;
        if (!accountId) {
          accountId = accountSupplierId;
        }
        if (!accountTenancyInvoiceId) {
          accountTenancyInvoiceId = accountSupplierId;
        }
        this.creditor.setValue(currentSupplier?.id);
        this.account.setValue(accountId);
        this.accountTenancyInvoice.setValue(accountTenancyInvoiceId);
        this.invoiceDocument.setValue(this.currentData?.invoiceDocument?.url);
        this.syncStatus = this.currentData?.syncStatus;
        this.syncDate = this.currentData?.syncDate;
        this.creditorInvoiceFormService.getCurrentDataForForm(this.currentData);

        this.isShowCancelCreditor =
          this.currentData?.creditorInvoice?.status?.toUpperCase() ===
          EInvoiceStatus.UNPAID;

        this.isShowCancelTenancy =
          this.currentData?.tenancyInvoice?.status?.toUpperCase() ===
          EInvoiceStatus.UNPAID;
        this.getCurrentData();
        if (
          this.currentData?.creditorInvoice?.id &&
          !this.currentData?.invoiceDocument
        ) {
          this.isDisplayCheckbox = false;
        }
      });
  }

  private conversationAttacments() {
    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$.getValue();
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
          fileType: READONLY_FILE.pdf
        }))
      )
    );
  }

  onModalScroll() {
    const modalElement = document.querySelector('.creditor-form-wrapper');
    if (modalElement) {
      setTimeout(() => {
        modalElement.scrollTo(0, modalElement.scrollHeight);
      }, 100);
    }
  }

  onCheckboxChange(event) {
    this.isUpLoad.setValue(Boolean(event.target.checked));
  }

  formatTime(time: Date) {
    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$.getValue();
    return dayjs(time).format(DATE_FORMAT_DAYJS);
  }

  getCurrentData() {
    const currentData = this.currentData;
    this.canEdit = this.checkCanEdit(currentData);
    if (!this.canEdit) {
      if (!this.currentData?.isLinkInvoice) this.hasFooter = false;
      this.myForm.disable();
    }
    if (this.canEdit && this.syncStatus !== ESyncStatus.INPROGRESS) {
      this.myForm.enable();
      this.property.disable();
    }

    if (currentData?.isLinkInvoice) {
      this.tenacyInvoice.setValue(currentData?.tenancyInvoice?.tenancyId);
      this.isTaskTenant = true;
    }

    if (!currentData?.isLinkInvoice) {
      this.tenacyInvoice.setValue('');
      this.cdRef.markForCheck();
    }

    if (currentData?.invoiceDocument) {
      this.isShowFile = true;
      const extension = currentData?.invoiceDocument.name.match(/\.pdf$/i);
      if (!extension) {
        this.isImage = true;
      }
      this.saveUrlEmbed = currentData?.invoiceDocument?.url;
      this.isShowPdf = true;
    } else {
      this.isShowPdf = false;
    }

    if (this.isOtherTaskInvoice) {
      this.invoiceDocument.disable();
      this.creditor.disable();
      this.tenacyInvoice.disable();
    }
    this.isUpLoad.setValue(Boolean(currentData?.invoiceDocument?.isUpload));
    this.isShowFeildTenacy = !!currentData?.tenancyInvoice;
    this.widgetPTService.setTenanciesID(currentData?.tenancyInvoice?.tenancyId);
  }

  checkCanEdit(currentData: InvoiceDataReq) {
    if (!currentData?.isLinkInvoice) {
      return (
        currentData?.creditorInvoice?.status?.toUpperCase() !==
          EInvoiceStatus.CANCELLED &&
        currentData?.creditorInvoice?.status?.toUpperCase() !==
          EInvoiceStatus.PAID &&
        currentData?.creditorInvoice?.status?.toUpperCase() !==
          EInvoiceStatus.PARTPAID
      );
    } else {
      return currentData?.syncStatus === ESyncStatus.FAILED;
    }
  }

  handleGetListTenacy() {
    this.propertyService.peopleList$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.listofTenacyUser = res.tenancies;
          if (!this.isShowFeildTenacy) {
            this.listofTenacyUser = [
              { id: '', name: 'None' },
              ...this.listofTenacyUser
            ];
          }
          this.tenacyInvoice.setValue(
            this.currentData?.tenancyInvoice?.tenancyId || ''
          );
        }
      });
  }

  isFormValidate() {
    this.formValidate.creditor = !this.creditor.value;
    this.formValidate.account = !this.account.value;
    this.formValidate.description = !this.description.value;
    this.formValidate.invoiceREF = !this.invoiceREF.value;
    this.formValidate.amountExcludingGST = !this.amountExcludingGST.value;
    this.formValidate.amountIncludingGST = !this.amountIncludingGST.value;
    this.formValidate.dueDate = !this.dueDate.value;
    this.formValidate.accountTenancyInvoice = !this.accountTenancyInvoice.value;
    switch (this.isShowFeildTenacy) {
      case true:
        this.formValidate.tenacyInvoice = !this.tenacyInvoice.value;
        this.formValidate.descriptionTenacy = !this.descriptionTenacy.value;
        this.formValidate.dateTenant = !this.dateTenant.value;
        this.formValidate.amountExcludingGSTsecond =
          !this.amountExcludingGSTsecond.value;
        this.formValidate.amountIncludingGSTsecond =
          !this.amountIncludingGSTsecond.value;
        if (Object.values(this.formValidate).some((item) => item === true)) {
          return false;
        }
        return true;
      default:
        if (
          !this.description.value ||
          !this.creditor.value ||
          !this.invoiceREF.value ||
          !this.amountExcludingGST.value ||
          !this.amountIncludingGST.value ||
          !this.dueDate.value
        ) {
          return false;
        }
        return true;
    }
  }

  setErrorAccountForm(
    field: string,
    value: boolean,
    message: string,
    touching: boolean,
    required: boolean
  ) {
    this.errors[field].hasError = value;
    this.errors[field].msg = message;
    this.errors[field].isTouching = touching;
    this.errors[field].isRequired = required;
  }

  onChangeDecimalNumber(event, field: string) {
    if (field === 'gstAmount') {
      if (!this.gstAmount.value) {
        this.amountIncludingGST.setValue(this.amountExcludingGST.value);
      } else {
        const inclAmount = convertStringToNumber(this.amountIncludingGST.value);
        const exclAmount = convertStringToNumber(this.amountExcludingGST.value);
        const gstAmount = convertStringToNumber(this.gstAmount.value);
        if (inclAmount && exclAmount && gstAmount <= exclAmount) {
          if (this.isInclGSTEdittedLast) {
            this.amountExcludingGST.setValue(
              formatNumber(inclAmount - gstAmount)
            );
          } else {
            this.amountIncludingGST.setValue(
              formatNumber(exclAmount + gstAmount)
            );
          }
        }
      }
    }
    if (field === 'gstAmountSecond') {
      if (!this.gstAmountSecond.value) {
        this.amountIncludingGSTsecond.setValue(
          this.amountExcludingGSTsecond.value
        );
      } else {
        const secondInclAmount = convertStringToNumber(
          this.amountIncludingGSTsecond.value
        );
        const secondExclAmount = convertStringToNumber(
          this.amountExcludingGSTsecond.value
        );
        const secondGstAmount = convertStringToNumber(
          this.gstAmountSecond.value
        );
        if (
          secondInclAmount &&
          secondExclAmount &&
          secondGstAmount <= secondExclAmount
        ) {
          if (this.isSecondInclGSTEdittedLast) {
            this.amountExcludingGSTsecond.setValue(
              formatNumber(secondInclAmount - secondGstAmount)
            );
          } else {
            this.amountIncludingGSTsecond.setValue(
              formatNumber(secondExclAmount + secondGstAmount)
            );
          }
        }
      }
    }

    if (field === 'amountExcludingGST') {
      this.isInclGSTEdittedLast = false;
      const amountExclGst = convertStringToNumber(
        this.amountExcludingGST.value
      );
      const gstValue = calculateGSTFromPreTaxExpense(amountExclGst);
      this.gstAmount.setValue(formatNumber(gstValue));
      const amountInclGst =
        amountExclGst !== null ? formatNumber(amountExclGst + gstValue) : null;
      this.amountIncludingGST.setValue(amountInclGst);
    }

    if (field === 'amountExcludingGSTsecond') {
      this.isSecondInclGSTEdittedLast = false;
      const amountExclGstSecond = convertStringToNumber(
        this.amountExcludingGSTsecond.value
      );
      const gstValueSecond = calculateGSTFromPreTaxExpense(amountExclGstSecond);
      this.gstAmountSecond.setValue(formatNumber(gstValueSecond));
      const amountInclGstSecond =
        amountExclGstSecond !== null
          ? formatNumber(amountExclGstSecond + gstValueSecond)
          : null;
      this.amountIncludingGSTsecond.setValue(amountInclGstSecond);
    }

    if (field === 'amountIncludingGST') {
      this.isInclGSTEdittedLast = true;
      const amountInclGst = convertStringToNumber(
        this.amountIncludingGST.value
      );
      const gstValue = calculateGSTFromTotalExpense(amountInclGst);
      this.gstAmount.setValue(formatNumber(gstValue));
      const amountExclGst =
        amountInclGst !== null ? formatNumber(amountInclGst - gstValue) : null;
      this.amountExcludingGST.setValue(amountExclGst);
    }

    if (field === 'amountIncludingGSTsecond') {
      this.isSecondInclGSTEdittedLast = true;
      const amountInclGstSecond = convertStringToNumber(
        this.amountIncludingGSTsecond.value
      );
      const gstValueSecond = calculateGSTFromTotalExpense(amountInclGstSecond);
      this.gstAmountSecond.setValue(formatNumber(gstValueSecond));
      const amountExclGstSecond =
        amountInclGstSecond !== null
          ? formatNumber(amountInclGstSecond - gstValueSecond)
          : null;
      this.amountExcludingGSTsecond.setValue(amountExclGstSecond);
    }
  }

  checkError(inputValue, isRequiredField, field) {
    if (inputValue.length === 0 && isRequiredField) {
      this.setErrorAccountForm(field, true, 'Required field', true, true);
    } else {
      const regex = /^\d+(\,\d{3})*(\.\d{1,2})?$/;
      const bsbValue = inputValue.match(regex);

      if (
        this.validateAmountNumberInput.test(inputValue) &&
        (field === 'amountExcludingGST' ||
          field === 'amountExcludingGSTsecond' ||
          field === 'amountIncludingGST' ||
          field === 'amountIncludingGSTsecond')
      ) {
        this.setErrorAccountForm(field, true, 'Invalid number', true, false);
      } else if (
        bsbValue ||
        (!bsbValue &&
          (field === 'gstAmount' || field === 'gstAmountSecond') &&
          inputValue.length === 0)
      ) {
        this.setErrorAccountForm(field, false, '', true, false);
      } else {
        this.setErrorAccountForm(field, true, 'Invalid number', true, false);
      }
    }
  }

  close() {
    this.onClose.emit();
    this.currentData = null;
    this.widgetPTService.setPopupWidgetState(null);
    this.widgetPTService.setModalUpdate(false);
    this.preventButtonService.deleteProcess(
      EButtonStepKey.CREDITOR_INVOICE,
      EButtonType.STEP
    );
  }

  cancel() {
    const currentStep = this.stepService.currentPTStep.getValue();
    const agencyId = this.currentAgencyId;
    const invoiceId = this.isCreditorInvoce
      ? this.currentData?.creditorInvoice?.id
      : this.currentData?.tenancyInvoice?.id;
    const taskId = this.taskService.currentTaskId$.getValue();
    const body = {
      taskId,
      agencyId: this.currentAgencyId
    };
    this.creditorServiceProperty.updateListCreditorInvoice(
      {
        ...this.currentData,
        syncStatus: ESyncStatus.INPROGRESS,
        firstTimeSyncSuccess: false
      },
      this.currentData.id
    );
    if (this.currentData.isLinkInvoice) {
      this.tenancyInvoicingService.updateListTenancyInvoice(
        {
          ...this.currentData,
          syncStatus: ESyncStatus.INPROGRESS,
          firstTimeSyncSuccess: false
        },
        this.currentData.id
      );
    }
    this.creditorServiceProperty.cancelInvoice(body, invoiceId).subscribe({
      next: (res) => {
        if (res) {
          this.creditorServiceProperty.updateListCreditorInvoice(
            {
              ...res,
              firstTimeSyncSuccess:
                res.syncStatus === SyncMaintenanceType.COMPLETED
            },
            res.id
          );
          if (res.isLinkInvoice) {
            this.tenancyInvoicingService.updateListTenancyInvoice(
              {
                ...res,
                firstTimeSyncSuccess:
                  res.syncStatus === SyncMaintenanceType.COMPLETED
              },
              res.id
            );
          }

          const trudiResponeTemplate =
            this.trudiService.getTrudiResponse?.getValue();

          if (res?.syncStatus === this.syncPropertyTree.COMPLETED) {
            if (trudiResponeTemplate?.isTemplate) {
              this.stepService.updateButtonStatusTemplate(
                currentStep?.id,
                EPropertyTreeButtonComponent.CREDITOR_INVOICE,
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
        if (
          this.creditorServiceProperty.isInvoiceSync.getValue() &&
          this.creditorServiceProperty.selectedCreditorInvoice$.getValue()
            ?.id === res.id
        ) {
          this.creditorServiceProperty.setSelectedCreditorInvoice(res);
        }
      },
      error: (err) => {
        this.toastService.error(err.error.message);
      }
    });

    this.onClose.emit();
    this.showPopupConfirm = false;
  }

  confirmCancel(isCreditorInvoice: boolean) {
    this.isCreditorInvoce = isCreditorInvoice;
    this.showPopupConfirm = true;
    this.isCreditorInvoice = false;
  }

  goBack() {
    this.isCreditorInvoice = true;
    this.showPopupConfirm = false;
  }

  checkErrorValue(errors): boolean {
    if (
      this.isShowFeildTenacy &&
      (errors['amountExcludingGSTsecond'].hasError ||
        errors['amountIncludingGSTsecond'].hasError ||
        errors['gstAmountSecond'].hasError)
    ) {
      return true;
    } else if (
      errors['gstAmount'].hasError ||
      errors['amountExcludingGST'].hasError ||
      errors['amountIncludingGST'].hasError
    ) {
      return true;
    }
    return false;
  }

  handleBack() {
    if (this.showBackButton) {
      this.back.emit();
      return;
    }
    if (this.isUpdateCreditorInvoiceModal) {
      this.widgetPTService.setPopupWidgetState(EPropertyTreeType.UPDATE_WIDGET);
      return;
    }
    this.creditorServiceProperty.setSelectedCreditorInvoice(null);
  }

  sync() {
    if (this.isArchiveMailbox) return;
    const currentStep = this.stepService.currentPTStep.getValue();
    const hasError =
      this.checkErrorValue(this.errors) ||
      (this.myForm.invalid &&
        ((this.myForm?.errors && this.myForm.errors['overGSTAmount']) ||
          (this.isShowFeildTenacy &&
            this.myForm?.errors &&
            this.myForm.errors['overGSTAmountSecond'])));
    if (!this.isFormValidate() || hasError) return;
    const propertyId = this.propertyService.newCurrentProperty.value?.id;
    const agencyId = this.currentAgencyId;
    const taskId = this.taskService.currentTaskId$.getValue();
    this.showSidebarRightService.handleToggleSidebarRight(true);
    const invoice = {
      id: !this.currentData?.id ? null : this.currentData?.id,
      supplierId: this.creditor.value,
      isLinkInvoice: this.isShowFeildTenacy ? true : false,
      syncStatus: SyncMaintenanceType.INPROGRESS,
      creditorInvoice: {
        id: this?.currentData?.creditorInvoice?.id,
        description: this.description.value,
        dueDate: this.agencyDateFormatService.expectedTimezoneStartOfDay(
          this.dueDate.value
        ),
        salesTax: this.toFixedFloat(
          this.sharedService.removeCommaInNumber(this.gstAmount.value)
        ),
        amount: this.toFixedFloat(
          Number(
            this.sharedService.removeCommaInNumber(
              this.amountExcludingGST?.value
            )
          ) +
            Number(
              this.sharedService.removeCommaInNumber(this.gstAmount?.value)
            )
        ),
        creditorReference: this.invoiceREF.value,
        status: this?.currentData?.creditorInvoice?.status,
        accountId: this.account.value
      },
      invoiceDocument:
        (this.invoicePrefillValue && this.invoicePrefillValue?.pdfName) ||
        (this.currentData && this.currentData?.invoiceDocument?.name) ||
        this.invoiceDocument.value
          ? {
              name:
                this.invoicePrefillValue?.pdfName ||
                this.currentData?.invoiceDocument.name,
              url:
                this.invoicePrefillValue?.pdfUrl ||
                this.currentData?.invoiceDocument.url ||
                this.invoiceDocument.value,
              isUpload: Boolean(this.isUpLoad.value)
            }
          : null,
      invoiceWidgetType: EInvoice.CREDITOR_INVOICE
    };
    const formatBodySyncInvoice = {
      taskId,
      propertyId,
      invoice,
      agencyId: this.currentAgencyId,
      stepId: currentStep ? currentStep?.id : this.currentData?.stepId
    };

    if (this.isShowFeildTenacy) {
      const tenancyInvoice = {
        tenancyId: this.tenacyInvoice.value,
        description: this.descriptionTenacy.value,
        dueDate: this.agencyDateFormatService.expectedTimezoneStartOfDay(
          this.dateTenant.value
        ),
        salesTax: this.toFixedFloat(
          this.sharedService.removeCommaInNumber(this.gstAmountSecond.value)
        ),
        amount: this.toFixedFloat(
          Number(
            this.sharedService.removeCommaInNumber(
              this.amountExcludingGSTsecond?.value
            )
          ) +
            Number(
              this.sharedService.removeCommaInNumber(
                this.gstAmountSecond?.value
              )
            )
        ),
        sendEmailTenancyInvoice: this.sendEmailTenancyInvoice.value,
        creditorReference: this.invoiceREF.value,
        status: this.currentData?.tenancyInvoice?.status,
        accountId: this.accountTenancyInvoice.value
      };
      formatBodySyncInvoice.invoice['tenancyInvoice'] = {
        ...tenancyInvoice
      };
    }
    this.syncInvoice(formatBodySyncInvoice);
    this.onClose.emit();
    this.widgetPTService.setPopupWidgetState(null);
    this.widgetPTService.setModalUpdate(false);
    this.preventButtonService.deleteProcess(
      EButtonStepKey.CREDITOR_INVOICE,
      EButtonType.STEP
    );
  }

  convertToDecimalNumber(number) {
    if (!number) return;
    return number.toLocaleString('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  syncInvoice(body) {
    const currentStep = this.stepService.currentPTStep.getValue();
    const idInvoice = this.currentData?.id ? this.currentData?.id : uuid4();
    if (this.isShowFeildTenacy) {
      this.tenancyInvoicingService.updateListTenancyInvoice(
        {
          ...body.invoice,
          stepId: currentStep ? currentStep?.id : this.currentData?.stepId,
          id: idInvoice,
          createdAt: this.currentData?.createdAt
            ? this.currentData?.createdAt
            : new Date()
        },
        idInvoice
      );
    }
    this.creditorServiceProperty.updateListCreditorInvoice(
      {
        ...body.invoice,
        id: idInvoice,
        stepId: currentStep ? currentStep?.id : this.currentData?.stepId,
        createdAt: this.currentData?.createdAt
          ? this.currentData?.createdAt
          : new Date()
      },
      idInvoice
    );
    const taskNameId =
      this.taskService.currentTask$.value?.trudiResponse?.setting?.taskNameId;

    if (!this.currentData) {
      this.creditorServiceProperty.syncInvoicesToProperty(body).subscribe({
        next: (res) => {
          this.creditorServiceProperty.updateListCreditorInvoice(
            {
              ...res,
              firstTimeSyncSuccess:
                res.syncStatus === SyncMaintenanceType.COMPLETED
            },
            idInvoice
          );
          if (
            this.creditorServiceProperty.selectedCreditorInvoice$.getValue()
              ?.id === idInvoice
          ) {
            this.creditorServiceProperty.setSelectedCreditorInvoice(res);
          }
          if (res.isLinkInvoice) {
            this.tenancyInvoicingService.updateListTenancyInvoice(
              {
                ...res,
                firstTimeSyncSuccess:
                  res.syncStatus === SyncMaintenanceType.COMPLETED
              },
              idInvoice
            );
          }
          const trudiResponeTemplate =
            this.trudiService.getTrudiResponse?.getValue();
          if (
            trudiResponeTemplate?.isTemplate &&
            res.syncStatus === SyncMaintenanceType.COMPLETED
          ) {
            this.stepService.updateButtonStatusTemplate(
              res?.stepId,
              EPropertyTreeButtonComponent.CREDITOR_INVOICE,
              currentStep
                ? EButtonAction[currentStep?.action.toUpperCase()]
                : EButtonAction.PT_NEW_COMPONENT,
              res?.id
            );
          }
          if (
            res.syncStatus === SyncMaintenanceType.COMPLETED &&
            (taskNameId !== TaskNameId.invoiceTenant || res.isLinkInvoice)
          ) {
            super.updateButtonStatus();
          }
        },
        error: (err) => {
          this.toastService.error(err.error.message);
        }
      });
    } else {
      this.creditorServiceProperty
        .updateInvoicesToProperty(body, idInvoice)
        .subscribe({
          next: (res) => {
            this.creditorServiceProperty.updateListCreditorInvoice(
              {
                ...res,
                firstTimeSyncSuccess:
                  res.syncStatus === SyncMaintenanceType.COMPLETED
              },
              idInvoice
            );
            if (
              this.creditorServiceProperty.isInvoiceSync.getValue() &&
              this.creditorServiceProperty.selectedCreditorInvoice$.getValue()
                ?.id === res.id
            ) {
              this.creditorServiceProperty.setSelectedCreditorInvoice(res);
            }

            if (res.isLinkInvoice) {
              this.tenancyInvoicingService.updateListTenancyInvoice(
                {
                  ...res,
                  firstTimeSyncSuccess:
                    res.syncStatus === SyncMaintenanceType.COMPLETED
                },
                idInvoice
              );
            }
            const trudiResponeTemplate =
              this.trudiService.getTrudiResponse?.getValue();
            if (
              trudiResponeTemplate?.isTemplate &&
              res.syncStatus === SyncMaintenanceType.COMPLETED
            ) {
              this.stepService.updateButtonStatusTemplate(
                res?.stepId,
                EPropertyTreeButtonComponent.CREDITOR_INVOICE,
                currentStep
                  ? EButtonAction[currentStep?.action.toUpperCase()]
                  : EButtonAction.PT_NEW_COMPONENT,
                res?.id
              );
            }
            if (
              res.syncStatus === SyncMaintenanceType.COMPLETED &&
              !this.currentData?.creditorInvoice?.status &&
              (taskNameId !== TaskNameId.invoiceTenant || res.isLinkInvoice)
            ) {
              super.updateButtonStatus();
            }
          }
        });
    }
  }

  toFixedFloat(value: string | number, number = 2) {
    if (!value) return '';
    return typeof value === 'string'
      ? Number(Number(value).toFixed(number))
      : Number(value.toFixed(number));
  }

  onCreditorSelectChanged(item) {
    const accountSupplierId = this.listAccount.find(
      (e) => e.accountCode === item?.accountCode
    )?.id;
    if (!this.account.value) this.account.setValue(accountSupplierId);
    if (!this.accountTenancyInvoice.value)
      this.accountTenancyInvoice.setValue(accountSupplierId);
  }

  onTenancySelectChanged(e) {
    this.sendEmailTenancyInvoice.setValue(true);
    this.widgetPTService.setTenanciesID(e?.id);
    this.isShowFeildTenacy = !!e?.type;
    this.onModalScroll();
    if (!this.isShowFeildTenacy) {
      this.formValidate.descriptionTenacy = false;
      this.formValidate.amountExcludingGSTsecond = false;
      this.formValidate.amountIncludingGSTsecond = false;
      this.formValidate.gstAmountSecond = false;
    }
  }

  async onInvoiceSelectchanged(event) {
    try {
      if (!event?.pdfUrl) return;

      this.saveUrlEmbed = event?.pdfUrl;
      this.isUpLoad.setValue(true);
      this.isImage = event?.fileType !== READONLY_FILE.pdf;
      this.isShowPdf = Boolean(event);

      const invoiceData = (await this.getInvoiceData(event.pdfUrl)) || {};

      const selectedFile = {
        ...event,
        ...invoiceData
      };

      this.invoicePrefillValue = selectedFile;
      if (selectedFile && selectedFile?.isInvoice) {
        if (this.listSupplier) {
          this.setSupplierPT();
        }
        const excludingGST = selectedFile.totalAmount
          ? formatNumber(selectedFile.totalAmount)
          : null;
        this.amountExcludingGST.setValue(excludingGST);
        let gst = null;
        let inclGSTAmount = null;
        if (selectedFile.totalAmount) {
          gst = selectedFile.gstAmount
            ? formatNumber(selectedFile.gstAmount)
            : excludingGST
            ? formatNumber((Number(excludingGST) * this.GSTPercent) / 100)
            : null;
          inclGSTAmount = formatNumber(Number(excludingGST) + Number(gst));
        }
        this.gstAmount.setValue(gst);
        this.amountIncludingGST.setValue(inclGSTAmount);
        const date =
          this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            selectedFile.dueDate
          )
            ? selectedFile.dueDate
            : null;
        this.dueDate.setValue(date);
      } else {
        this.amountExcludingGST.setValue(null);
        this.gstAmount.setValue(null);
        this.amountIncludingGST.setValue(null);
        this.dueDate.setValue(null);
      }
    } catch (error) {
      console.error(error);
    }
  }

  handleSearchInvoiceDocument(e) {
    this.searchNameDocument = e.term;
  }

  searchFn(searchText: string, item) {
    return (
      item.pdfName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.subTitle.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  onCloseInvoiceDocument() {
    this.searchNameDocument = '';
  }

  handleClear() {
    this.dueDate.setValue(null);
    this.amountExcludingGST.setValue(null);
    this.amountIncludingGST.setValue(null);
    this.gstAmount.setValue(null);
    this.saveUrlEmbed = null;
    this.isShowPdf = false;
    this.isUpLoad.setValue(false);
    this.selectElement?.handleClearClick();
    this.isOnlySupplier = false;
    this.searchNameDocument = '';
  }

  setSupplierPT() {
    const supplierSelected = [this.invoicePrefillValue].flatMap(
      (item) => item?.user
    );
    const supplierPT = this.listSupplier.find((item1) => {
      const item2 = supplierSelected.find((item2) => item2?.id === item1?.id);
      return item2;
    });
    const isSupplierPT = this.listSupplier?.find(
      (item) => item.id === supplierSelected[0]?.id
    );
    if (
      this.invoicePrefillValue &&
      this.invoicePrefillValue?.user?.type === EConfirmContactType.SUPPLIER &&
      isSupplierPT
    ) {
      this.selectElement?.handleClearClick();
      this.isOnlySupplier = true;
      this.creditor.patchValue(supplierPT?.id);
      const accountId =
        this.listAccount.find((e) => e.accountCode === supplierPT?.accountCode)
          ?.id || null;
      !!accountId && this.account.patchValue(accountId);
      !!accountId && this.accountTenancyInvoice.patchValue(accountId);
    } else {
      this.selectElement?.handleClearClick();
      this.isOnlySupplier = false;
    }
  }

  getListAccount() {
    this.taskService.currentTask$.value?.trudiResponse?.setting?.taskNameId;
    this.creditorServiceProperty.setTypeTaskInvoice
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.isShowFeildTenacy = true;
          this.isTaskTenant = true;
        }
      });
  }

  triggerUploadFile() {
    this.inputUploadfile.nativeElement.click();
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

  async handleFileUpload(file) {
    try {
      this.loading.listInvoice = true;
      this.isImage = !file?.name?.includes('.pdf');
      const { name, type, size } = file || {};
      const { DATE_FORMAT_DAYJS } =
        this.agencyDateFormatService.dateFormat$.getValue();

      const infoLink = await this.fileUpload.uploadFile2(
        file,
        this.propertyService.currentPropertyId.value
      );

      const fileLocal = {
        pdfName: name,
        size,
        fileType: type,
        pdfUrl: infoLink?.Location,
        user: {
          firstName: this.currentPM?.firstName,
          lastName: this.currentPM?.lastName
        },
        checked: false,
        created: dayjs.utc(new Date()).toISOString(),
        icon: this.mapFileIcon(name),
        subTitle: getCreditorName(
          this.currentPM?.firstName,
          this.currentPM?.lastName
        )
      };

      this.invoiceSelect.searchTerm = '';
      this.listInvoiceDocument = [
        ...this.listInvoiceDocument,
        { ...fileLocal }
      ];

      this.invoiceDocument.setValue(infoLink?.Location);

      this.onInvoiceSelectchanged(fileLocal);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading.listInvoice = false;
    }
  }

  private async detectInvoice(fileUrl: string) {
    const invoice = await lastValueFrom(
      this.propertyService.detectDataInvoice(fileUrl)
    );
    return invoice;
  }

  private async getInvoiceData(fileUrl: string) {
    try {
      const { DATE_FORMAT_DAYJS } =
        this.agencyDateFormatService.dateFormat$.getValue();
      const cacheInvoice = this.invoiceDataLookup[fileUrl];

      if (cacheInvoice) return cacheInvoice;

      const invoiceData = await this.detectInvoice(fileUrl);

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

  private mapFileIcon(fileName) {
    const fileExtension = this.fileService.getFileExtension(fileName);
    if (fileExtension === '.pdf') {
      return 'pdfInvoice';
    } else {
      return 'imageInvoice';
    }
  }

  get isOtherTaskInvoice() {
    return (
      !!this.currentData?.creditorInvoice?.ptId &&
      this.currentData?.syncStatus === ESyncStatus.NOT_SYNC
    );
  }

  get isSynced() {
    return (
      this.currentData?.syncStatus === ESyncStatus.COMPLETED ||
      this.isOtherTaskInvoice
    );
  }

  ngOnDestroy(): void {
    this.creditorServiceProperty.setTypeTaskInvoice.next(null);
    this.creditorServiceProperty.setSelectedCreditorInvoice(null);
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  get myForm() {
    return this.creditorInvoiceFormService?.myForm;
  }

  get description() {
    return this.myForm.get('description');
  }
  get descriptionTenacy() {
    return this.myForm.get('descriptionTenacy');
  }
  get creditor() {
    return this.myForm.get('creditor');
  }
  get account() {
    return this.myForm.get('account');
  }
  get property() {
    return this.myForm.get('property');
  }
  get invoiceREF() {
    return this.myForm.get('invoiceREF');
  }
  get amountExcludingGST() {
    return this.myForm.get('amountExcludingGST');
  }
  get amountIncludingGST() {
    return this.myForm.get('amountIncludingGST');
  }
  get amountExcludingGSTsecond() {
    return this.myForm.get('amountExcludingGSTsecond');
  }
  get amountIncludingGSTsecond() {
    return this.myForm.get('amountIncludingGSTsecond');
  }
  get gstAmountSecond() {
    return this.myForm.get('gstAmountSecond');
  }
  get gstAmount() {
    return this.myForm.get('gstAmount');
  }
  get tenacyInvoice() {
    return this.myForm.get('tenacyInvoice');
  }
  get accountForm() {
    return this.myForm.get('accountForm');
  }
  get invoiceDocument() {
    return this.myForm.get('invoiceDocument');
  }
  get dueDate() {
    return this.myForm.get('dueDate');
  }
  get accountTenancyInvoice() {
    return this.myForm.get('accountTenancyInvoice');
  }
  get dateTenant() {
    return this.myForm.get('dateTenant');
  }
  get isUpLoad() {
    return this.myForm.get('isUpLoad');
  }

  get statusTenancy() {
    return this.currentData?.tenancyInvoice?.status;
  }

  get sendEmailTenancyInvoice() {
    return this.myForm.get('sendEmailTenancyInvoice');
  }
}
