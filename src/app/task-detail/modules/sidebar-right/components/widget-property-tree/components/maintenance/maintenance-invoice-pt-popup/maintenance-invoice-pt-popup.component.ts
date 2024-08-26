import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import dayjs from 'dayjs';
import { ToastrService } from 'ngx-toastr';
import { Subject, combineLatest, lastValueFrom } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  takeUntil
} from 'rxjs/operators';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { getCreditorName } from '@/app/invoicing/tenancy-invoicing/utils/functions';
import {
  IDocuments,
  InvoiceType
} from '@/app/invoicing/tenancy-invoicing/utils/invoiceTypes';
import {
  FILE_VALID_INVOICE,
  READONLY_FILE,
  UploadErrorMsg
} from '@services/constants';
import { FileUploadService } from '@services/fileUpload.service';
import { FilesService } from '@services/files.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { UserService } from '@services/user.service';
import { EDirectives } from '@shared/enum/input.enum';
import { SendMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { validateFileExtension } from '@shared/feature/function.feature';
import { EAvailableFileIcon } from '@shared/types/file.interface';
import { MaintenanceSyncPtService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-sync-pt.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { fileLimit } from 'src/environments/environment';
import {
  EMaintenanceInvoiceAction,
  EMaintenanceInvoiceStatus
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/enum/maintenance/maintenance-invoice.enum';
import {
  ICreditor,
  IInputSyncMaintenanceInvoice,
  IInputUpdateSyncMaintenanceInvoice
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-invoice.interface';
import { IMaintenanceRequest } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-request.interface';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { MaintenanceInvoiceFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-invoice-form.service';
import { MaintenanceSyncPtApiService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-sync-pt-api.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SharedService } from '@services/shared.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { EPaymentMethod, paymentMethodName } from '@shared/enum';
import { CreditorInvoicingPropertyService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/creditor-invoice.service';
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
  selector: 'maintenance-invoice-pt-popup',
  templateUrl: './maintenance-invoice-pt-popup.component.html',
  styleUrls: ['./maintenance-invoice-pt-popup.component.scss']
})
export class MaintenanceInvoicePtPopupComponent implements OnInit, OnDestroy {
  @ViewChild('invoiceSelect') invoiceSelect: NgSelectComponent;
  private unsubscribe = new Subject<void>();
  public creditorOptions: ICreditor[] = [];
  public listAccount = [];
  public selectedDocumentUrl: string = '';
  public EAvailableFileIcon = EAvailableFileIcon;
  public selectedDocumentType: EAvailableFileIcon | string =
    EAvailableFileIcon.Other;
  public agencyID: string = '';
  public invoiceDocuments: IDocuments[] = [];
  public disableSyncBtn: boolean = false;
  public fileDocument: IDocuments;
  public popupState: boolean = false;
  public syncStatus = ESyncStatus.NOT_SYNC;
  private tempSyncStatus = ESyncStatus.NOT_SYNC;
  public lastTimeSynced: string | Date;
  public currentInvoiceId: string = '';
  public isEditInvoice: boolean = false;
  public invoiceStatus: EMaintenanceInvoiceStatus;
  public invoiceAction: EMaintenanceInvoiceAction;
  private maintenanceRequestStatus: SendMaintenanceType;
  public readonly EDirectives = EDirectives;
  public EMaintenanceInvoiceAction = EMaintenanceInvoiceAction;
  public EMaintenanceInvoiceStatus = EMaintenanceInvoiceStatus;
  public ESyncPropertyTree = ESyncStatus;
  private isAbleUpdateUnsyncTime: boolean = false;
  public isShowConfirmCancelModal: boolean = false;
  private currentAgencyId: string;
  public acceptTypeFile = FILE_VALID_INVOICE;
  public currentPM = {
    firstName: '',
    lastName: ''
  };
  public loadingUploadFile: boolean = false;
  public searchNameDocument: string = '';
  public currentFileSelected;
  public maintenanceRequest: IMaintenanceRequest;
  public isUpdateMaintenanceInvoiceModal: boolean = false;
  public stepId: string = '';
  public syncPropertyTree = ESyncStatus;
  public isArchiveMailbox: boolean = false;
  readonly dateFormat$ = this.agencyDateFormatService.dateFormat$.getValue();
  public dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  public isConsole: boolean;
  public resultId: string;
  invoiceDataLookup = {};
  public paymentMethod: string;
  public readonly EPaymentMethod = EPaymentMethod;
  public modalId = StepKey.propertyTree.maintainaceInvoice;
  private isInclAmountEdittedLast: boolean = true;

  get maintenanceInvoiceForm() {
    return this.maintenanceInvoiceFormService.invoiceForm;
  }
  get invoiceTypeControl() {
    return this.maintenanceInvoiceForm.get('invoiceType');
  }
  get propertyStreetLine() {
    return this.taskService?.currentTask$?.getValue()?.property?.streetline;
  }
  get propertyName() {
    return this.taskService?.currentTask$?.getValue()?.property
      ?.shortenStreetline;
  }
  get invoiceDocument() {
    return this.maintenanceInvoiceForm.get('invoiceDocument');
  }
  get isUploadFile() {
    return this.maintenanceInvoiceForm.get('isUploadFile');
  }
  get invoiceForm() {
    return this.maintenanceInvoiceForm.get('creditorInvoice');
  }
  get creditor() {
    return this.invoiceForm.get('creditor');
  }
  get account() {
    return this.invoiceForm.get('account');
  }
  get invoiceDescription() {
    return this.invoiceForm.get('invoiceDescription');
  }
  get invoiceREF() {
    return this.invoiceForm.get('invoiceREF');
  }
  get dueDate() {
    return this.invoiceForm.get('dueDate');
  }
  get excludingGST() {
    return this.invoiceForm.get('excludingGST');
  }
  get includingGST() {
    return this.invoiceForm.get('includingGST');
  }
  get gstAmount() {
    return this.invoiceForm.get('gstAmount');
  }

  get totalGSTByDefaultPercent() {
    return this.excludingGST.value
      ? String(
          (Number(this.excludingGST.value) *
            this.maintenanceInvoiceFormService.GSTPercent) /
            100
        )
      : '';
  }

  get readonly() {
    return this.maintenanceInvoiceFormService.readonly;
  }

  get isDisplayCheckbox() {
    return this.maintenanceInvoiceFormService.isDisplayCheckbox;
  }

  constructor(
    private maintenanceInvoiceFormService: MaintenanceInvoiceFormService,
    private taskService: TaskService,
    private propertyService: PropertiesService,
    private fileService: FilesService,
    private agencyService: AgencyService,
    private maintenanceSyncPTService: MaintenanceSyncPtService,
    private widgetPTService: WidgetPTService,
    private trudiService: TrudiService,
    private maintenanceSyncPtApiService: MaintenanceSyncPtApiService,
    private creditorServiceProperty: CreditorInvoicingPropertyService,
    private fileUploadService: FileUploadService,
    private toastService: ToastrService,
    private userService: UserService,
    public stepService: StepService,
    public inboxService: InboxService,
    private agencyDateFormatService: AgencyDateFormatService,
    private showSidebarRightService: ShowSidebarRightService,
    private sharedService: SharedService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow: boolean) => (this.isArchiveMailbox = isShow));
    this.maintenanceInvoiceFormService.buildForm();

    this.getMaintenanceRequest();
    this.handleInitForm();
    this.getCreditors();

    this.creditorServiceProperty
      .getListSupplier()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.listAccount = res;
        }
      });

    this.maintenanceInvoiceFormService.selectedDocumentBS
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        if (value && value.isInvoice) {
          if (this.invoiceDocument?.value) {
            const prefillFormData =
              this.maintenanceInvoiceFormService?.prefillFormData();
            this.invoiceForm.patchValue(prefillFormData);
          }
        } else {
          this.selectedDocumentUrl = '';
          this.selectedDocumentType = null;
          this.paymentMethod = '';
          this.maintenanceInvoiceFormService?.prefillFormData();
        }
        this.selectedDocumentUrl = value?.pdfUrl || '';
        this.selectedDocumentType = value?.icon;
      });
    this.getInvoiceDocument();
    this.getSenderList();

    this.widgetPTService.popupWidgetState$
      .pipe(
        filter(
          (type: EPropertyTreeType) =>
            type === EPropertyTreeType.MAINTENANCE_INVOICE
        ),
        takeUntil(this.unsubscribe),
        switchMap(() => {
          return this.widgetPTService.getModalUpdate();
        })
      )
      .subscribe((res) => {
        this.isUpdateMaintenanceInvoiceModal = res;
      });
    this.creditor.valueChanges
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        const chosenCreditor = this.creditorOptions.find((u) => u.id === res);
        if (!chosenCreditor) {
          this.paymentMethod = '';
          return;
        }
        const chosenPaymentMethod = chosenCreditor['creditorPaymentMethod']
          ?.toUpperCase()
          ?.trim();
        this.paymentMethod = paymentMethodName[chosenPaymentMethod];
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
  private setPopupStatus(status: boolean): void {
    this.popupState = status;
  }
  private handleInitForm(): void {
    this.widgetPTService.popupWidgetState$
      .pipe(
        filter(
          (type: EPropertyTreeType) =>
            type === EPropertyTreeType.MAINTENANCE_INVOICE
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((type: EPropertyTreeType) => {
        if (type === EPropertyTreeType.MAINTENANCE_INVOICE) {
          this.setPopupStatus(true);
        }
      });
    this.getMaintenanceInvoiceData();
  }

  getMaintenanceInvoiceData() {
    this.maintenanceInvoiceFormService
      .getSelectedMaintenanceInvoice()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.invoiceDocuments = (
          (this.taskService.currentTask$.getValue()?.trudiResponse as any)
            ?.data?.[0]?.invoice || []
        ).map((item) => ({
          ...item,
          created: new Date(item?.created),
          icon: this.fileService.getFileIcon(item?.pdfName).split('.')[0]
        }));
        this.resultId = data?.resultId;
        if (data?.id) {
          if (!data.data.invoice?.creditorInvoice?.accountId) {
            const currentSupplier = this.creditorOptions.find(
              (e) => e.id === data.data.invoice?.supplierId
            );
            data.data.invoice.creditorInvoice.accountId = this.listAccount.find(
              (e) => e.accountCode === currentSupplier?.accountCode
            )?.id;
          }
          this.setValueFormMaintenanceInvoice(data.data.invoice);
          this.stepId = data?.stepId;
          this.isEditInvoice = true;
          this.syncStatus = data?.syncStatus;
          this.tempSyncStatus = data?.syncStatus;
          this.invoiceStatus = data.status;
          this.invoiceAction = data.action;
          this.handleDisableFieldByMaintenanceInvoice();
          this.lastTimeSynced = data?.updatedAt;
          this.currentInvoiceId = data?.invoiceId;
          const fileDocumentId = data.data.invoice?.file?.id;
          if (fileDocumentId) {
            const seletedDoc = this.invoiceDocuments.filter(
              (doc) => doc.id === fileDocumentId
            );
            this.fileDocument = seletedDoc[0] || null;
          }
          this.handleUpdateTimeWhenChangedDataForm();
        } else {
          this.isEditInvoice = false;
          this.syncStatus = ESyncStatus.NOT_SYNC;
          this.lastTimeSynced = null;
          this.handleDisableFieldByMaintenanceRequest();
        }

        const { file, creditorInvoice } = data?.data?.invoice || {};
        const { fileName, id, fileUrl } = file || {};
        const mapFile = {
          ...creditorInvoice,
          gstAmount: this.convertToDecimalNumber(creditorInvoice?.gstAmount),
          totalAmount: this.convertToDecimalNumber(creditorInvoice?.amount),
          pdfName: fileName,
          id,
          pdfUrl: fileUrl,
          created: data?.createdAt,
          subTitle: getCreditorName(
            this.currentPM?.firstName,
            this.currentPM?.lastName
          ),
          icon: this.fileService.getFileIcon(fileName)
        } as IDocuments;
        this.fileDocument = mapFile;
        const checkExistedFile = this.invoiceDocuments?.some(
          (item) => item?.id === id
        );
        if (!checkExistedFile && file) {
          this.invoiceDocuments = [...this.invoiceDocuments, mapFile];
        }
      });
  }

  convertToDecimalNumber(number) {
    if (!number) return;
    return number.toLocaleString('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private getMaintenanceRequest(): void {
    this.widgetPTService
      .getPTWidgetStateByType<IMaintenanceRequest[]>(
        PTWidgetDataField.MAINTENANCE_REQUEST
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((maintenanceRequest) => {
        if (maintenanceRequest.length > 0) {
          this.maintenanceRequest = maintenanceRequest[0];
          this.maintenanceRequestStatus = maintenanceRequest[0]?.status;
          this.handleDisableFieldByMaintenanceRequest();
        }
      });
  }

  setValueFormMaintenanceInvoice(value) {
    this.maintenanceInvoiceFormService.patchFormValues(value);
    this.selectedDocumentUrl = value?.file?.fileUrl || null;
    this.selectedDocumentType = this.fileService.getFileIcon(
      value?.file?.fileName
    );
  }

  private getInvoiceDocument() {
    combineLatest([
      this.conversationAttacments(),
      this.agencyService.getCreditor()
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([files, creditorOptions]) => {
        this.invoiceDocuments = files?.map(
          (file) =>
            ({
              ...file,
              icon: this.fileService.getFileIcon(file.pdfName),
              supplierId: this.getSupplierId(file.user.id, creditorOptions)
            } as IDocuments)
        );
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
          fileType: READONLY_FILE.pdf
        }))
      )
    );
  }

  private async getInvoiceData(fileUrl: string) {
    try {
      const cacheInvoice = this.invoiceDataLookup[fileUrl];
      const { DATE_FORMAT_DAYJS } =
        this.agencyDateFormatService.dateFormat$.getValue();

      if (cacheInvoice) return cacheInvoice;

      const invoiceData = await lastValueFrom(
        this.propertyService.detectDataInvoice(fileUrl)
      );

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

  private getCreditors() {
    this.agencyService
      .getCreditor()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.creditorOptions = res;
        }
      });
  }

  private getSupplierId = (id: string, arr: ICreditor[]) => {
    if (arr?.some((it) => it.id === id)) return id;
    return '';
  };

  handleBack() {
    if (this.isUpdateMaintenanceInvoiceModal) {
      this.widgetPTService.setPopupWidgetState(EPropertyTreeType.UPDATE_WIDGET);
      this.popupState = false;
      return;
    }
    this.maintenanceInvoiceFormService.setSelectedMaintenanceInvoice(null);
  }

  syncToPT() {
    if (this.isArchiveMailbox) return;
    const currentStep = this.stepService.currentPTStep.getValue();
    if (currentStep) {
      this.stepService.socketStep = currentStep;
    } else {
      this.stepService.socketStep = null;
    }
    this.maintenanceInvoiceFormService.invoiceForm
      .get('invoiceType')
      .setValue(InvoiceType.CreditorInvoice);
    if (this.maintenanceInvoiceFormService.invoiceForm.invalid) {
      this.maintenanceInvoiceFormService.invoiceForm.markAllAsTouched();
      return;
    }
    if (this.isEditInvoice) {
      this.updateSyncToPT();
    } else {
      this.createSyncToPT();
    }
    this.handleClose();
    this.showSidebarRightService.handleToggleSidebarRight(true);
  }
  createSyncToPT() {
    const payload = this.getPayloadSync() as IInputSyncMaintenanceInvoice;
    this.maintenanceSyncPtApiService
      .syncMaintenanceInvoiceToPT(payload)
      .subscribe((maintenanceInvoice) => {
        const currentInvoices =
          this.maintenanceSyncPTService.getMaintenanceSyncData()
            .maintenanceInvoice.data;
        let invoices = [];
        if (currentInvoices.length > 0) {
          invoices = [...currentInvoices, maintenanceInvoice];
        } else {
          invoices = [maintenanceInvoice];
        }
        this.widgetPTService.setPTWidgetStateByType(
          PTWidgetDataField.MAINTENANCE_INVOICE,
          'UPDATE',
          invoices
        );
      });
  }
  updateSyncToPT() {
    const payload = this.getPayloadSync(true) as IInputSyncMaintenanceInvoice;
    this.maintenanceSyncPtApiService
      .updateSyncMaintenanceInvoiceToPT(payload, this.currentInvoiceId)
      .subscribe((maintenanceInvoice) => {
        const currentInvoices =
          this.maintenanceSyncPTService.getMaintenanceSyncData()
            .maintenanceInvoice.data;
        const invoices = currentInvoices.map((item) =>
          item.invoiceId === maintenanceInvoice.invoiceId
            ? maintenanceInvoice
            : item
        );
        this.widgetPTService.setPTWidgetStateByType(
          PTWidgetDataField.MAINTENANCE_INVOICE,
          'UPDATE',
          invoices
        );
      });
    this.handleClose();
  }
  handleConfirmCancel() {
    const currentStep = this.stepService.currentPTStep.getValue();
    if (currentStep) {
      this.stepService.socketStep = currentStep;
    } else {
      this.stepService.socketStep = null;
    }
    const { id, agencyId } = this.taskService.currentTask$.value;
    const payload = {
      agencyId: agencyId,
      stepId: currentStep ? currentStep?.id : this.stepId,
      taskId: id
    };
    this.maintenanceSyncPtApiService
      .cancelInvoice(this.currentInvoiceId, payload)
      .subscribe((maintenanceInvoice) => {
        const currentInvoices =
          this.maintenanceSyncPTService.getMaintenanceSyncData()
            .maintenanceInvoice.data;
        const invoices = currentInvoices.map((item) =>
          item.invoiceId === maintenanceInvoice.invoiceId
            ? maintenanceInvoice
            : item
        );
        this.widgetPTService.setPTWidgetStateByType(
          PTWidgetDataField.MAINTENANCE_INVOICE,
          'UPDATE',
          invoices
        );
      });
    this.isShowConfirmCancelModal = false;
    this.handleClose();
  }
  cancelInvoice() {
    if (this.isArchiveMailbox) return;
    this.isShowConfirmCancelModal = true;
    this.setPopupStatus(false);
  }
  goBack() {
    this.isShowConfirmCancelModal = false;
    this.setPopupStatus(true);
  }
  getPayloadSync(isUpdate: boolean = false) {
    const agencyId = this.taskService.currentTask$?.value?.agencyId;
    const currentStep = this.stepService.currentPTStep.getValue();
    const taskId = this.taskService.currentTaskId$?.getValue();
    const invoice = this.maintenanceInvoiceFormService.generateInvoices();
    if (isUpdate) {
      return {
        agencyId: agencyId,
        taskId,
        invoice: invoice,
        stepId: currentStep ? currentStep?.id : this?.stepId
      } as IInputUpdateSyncMaintenanceInvoice;
    } else {
      const propertyId = this.propertyService.currentPropertyId?.getValue();
      return {
        agencyId: agencyId,
        taskId,
        propertyId,
        invoice: invoice,
        stepId: currentStep ? currentStep?.id : null
      } as IInputSyncMaintenanceInvoice;
    }
  }
  handleUpdateTimeWhenChangedDataForm() {
    //handle update time when change value form
    if (this.tempSyncStatus === ESyncStatus.COMPLETED) {
      this.isAbleUpdateUnsyncTime = true;
      this.maintenanceInvoiceForm.valueChanges
        .pipe(takeUntil(this.unsubscribe), debounceTime(200))
        .subscribe((change) => {
          if (
            this.maintenanceInvoiceForm.dirty &&
            this.isAbleUpdateUnsyncTime
          ) {
            this.syncStatus = ESyncStatus.UN_SYNC;
            this.lastTimeSynced = new Date();
          }
        });
    }
  }

  private async handleChangeInvoiceDocument(data) {
    try {
      if (!data?.pdfUrl) return;
      this.fileDocument = data;
      this.selectedDocumentUrl = data?.pdfUrl || '';
      this.selectedDocumentType = data?.icon;

      const invoiceData = (await this.getInvoiceData(data.pdfUrl)) || {};

      this.currentFileSelected = {
        ...data,
        ...invoiceData
      };
      this.maintenanceInvoiceFormService.selectedDocumentBS.next(
        this.currentFileSelected
      );
      this.maintenanceInvoiceFormService.isDisplayCheckbox = true;
      this.isUploadFile.setValue(true);
    } catch (error) {
      console.error(error);
    }
  }

  onCreditorSelectChanged(item) {
    const accountSupplierId = this.listAccount.find(
      (e) => e.accountCode === item?.accountCode
    )?.id;
    if (!this.account.value) this.account.setValue(accountSupplierId);
  }

  handleClear() {
    this.fileDocument = null;
    this.searchNameDocument = '';
    this.selectedDocumentUrl = null;
    this.selectedDocumentType = null;
  }

  onCloseInvoiceDocument() {
    this.searchNameDocument = '';
  }

  handleDisableFieldByMaintenanceInvoice() {
    if (
      this.syncStatus === ESyncStatus.INPROGRESS ||
      (this.syncStatus === ESyncStatus.COMPLETED &&
        this.invoiceAction === EMaintenanceInvoiceAction.CANCEL) ||
      (this.isOtherTaskInvoice &&
        this.invoiceAction === EMaintenanceInvoiceAction.CANCEL)
    ) {
      this.maintenanceInvoiceForm?.disable();
    }
    if (this.syncStatus === ESyncStatus.COMPLETED || this.isOtherTaskInvoice) {
      this.invoiceDocument.disable();
      this.creditor.disable();
      this.account.disable();
      this.isUploadFile.disable();
    }
  }
  handleDisableFieldByMaintenanceRequest() {
    if (
      this.maintenanceRequestStatus === SendMaintenanceType.CANCELLED ||
      this.maintenanceRequestStatus === SendMaintenanceType.COMPLETE
    ) {
      this.maintenanceInvoiceForm?.disable();
    }
    if (
      this.maintenanceRequestStatus === SendMaintenanceType.OPEN &&
      !this.isEditInvoice
    ) {
      this.maintenanceInvoiceForm.enable();
    }
  }

  handleClose() {
    this.maintenanceInvoiceFormService.selectedDocumentBS.next(null);
    this.fileDocument = null;
    this.setPopupStatus(false);
    this.isAbleUpdateUnsyncTime = false;
    this.maintenanceInvoiceFormService.isDisplayCheckbox = false;
    this.widgetPTService.setPopupWidgetState(null);
    this.maintenanceInvoiceForm.reset();
    this.maintenanceInvoiceFormService.setSelectedMaintenanceInvoice(null);
    this.selectedDocumentUrl = null;
    this.selectedDocumentType = null;
    this.invoiceStatus = null;
    this.getInvoiceDocument();
    this.widgetPTService.setModalUpdate(false);
    this.preventButtonService.deleteProcess(
      EButtonStepKey.MAINTENANCE_INVOICE,
      EButtonType.STEP
    );
  }
  onCheckboxChange(event) {
    this.isUploadFile.setValue(event?.target?.checked);
  }
  get disabledBtnCancel() {
    return this.syncStatus === ESyncStatus.INPROGRESS;
  }
  get disabledBtnSync() {
    return this.syncStatus === ESyncStatus.INPROGRESS;
  }

  get getIsShowBtnCancelInvoice() {
    const isActiveMaintenanceRequest = ![
      SendMaintenanceType.COMPLETE,
      SendMaintenanceType.CANCELLED
    ].includes(this.maintenanceRequestStatus);
    if (
      this.isOtherTaskInvoice &&
      this.invoiceStatus !== EMaintenanceInvoiceStatus.CANCEL &&
      isActiveMaintenanceRequest
    )
      return true;
    if (
      this.syncStatus === ESyncStatus.NOT_SYNC ||
      this.invoiceStatus === EMaintenanceInvoiceStatus.CANCEL ||
      !isActiveMaintenanceRequest
    ) {
      return false;
    }
    return true;
  }
  get getIsShowBtnSyncData() {
    if (
      this.invoiceStatus === EMaintenanceInvoiceStatus.CANCEL ||
      this.maintenanceRequestStatus === SendMaintenanceType.COMPLETE ||
      this.maintenanceRequestStatus === SendMaintenanceType.CANCELLED
    ) {
      return false;
    }
    return true;
  }

  get isOtherTaskInvoice() {
    return this.syncStatus === ESyncStatus.NOT_SYNC && !!this.resultId;
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
          ? UploadErrorMsg.INVALID_FILE
          : UploadErrorMsg.EXCEED_MAX_SIZE
      );
      return;
    }
    this.handleFileUpload(file);
  }

  handleSearchInvoiceDocument(event) {
    this.searchNameDocument = event?.term;
  }

  async handleFileUpload(file) {
    try {
      this.loadingUploadFile = true;
      const { name, type, size } = file || {};
      const infoLink = await this.fileUploadService.uploadFile2(
        file,
        this.propertyService.currentPropertyId.value
      );
      const { DATE_FORMAT_DAYJS } =
        this.agencyDateFormatService.dateFormat$.getValue();
      const fileUploadLocal = {
        id: uuid4(),
        pdfName: name,
        size,
        fileType: type,
        pdfUrl: infoLink?.Location,
        user: {
          firstName: this.currentPM?.firstName,
          lastName: this.currentPM?.lastName
        },
        subTitle: getCreditorName(
          this.currentPM?.firstName,
          this.currentPM?.lastName
        ),
        checked: false,
        icon: this.fileService.getFileIcon(name),
        created: dayjs.utc(new Date()).toISOString()
      } as IDocuments;
      this.loadingUploadFile = false;
      this.invoiceSelect.searchTerm = '';
      this.invoiceDocuments = [
        ...this.invoiceDocuments,
        { ...fileUploadLocal }
      ];
      this.maintenanceInvoiceFormService?.prefillFormData();
      this.invoiceDocument.setValue(fileUploadLocal.id);
      this.handleChangeInvoiceDocument(fileUploadLocal);
      this.invoiceSelect.blur();
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingUploadFile = false;
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

  searchFn(searchText: string, item) {
    return (
      item.pdfName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.subTitle.toLowerCase().includes(searchText.toLowerCase())
    );
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
  }
}
