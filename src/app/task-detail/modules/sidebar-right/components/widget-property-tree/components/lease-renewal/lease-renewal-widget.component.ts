import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import dayjs from 'dayjs';
import { TIME_FORMAT } from '@services/constants';
import { WidgetFormPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property-form.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import {
  Subject,
  filter,
  map,
  merge,
  of,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import {
  EPropertyTreeType,
  FORMAT_ICON_SYNC,
  IWidgetLease
} from '@/app/task-detail/utils/functions';
import { LeaseRenewalSync } from '@shared/types/trudi.interface';
import {
  LeaseRenewalRequestButtonAction,
  LeaseRenewalSyncStatus
} from '@shared/enum/lease-renewal-Request.enum';
import { LeaseRenewalService } from '@services/lease-renewal.service';
import { FormHelper } from '@trudi-ui';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { AgencyService } from '@services/agency.service';
import { FileUploadProp } from '@shared/types/share.model';
import { TrudiService } from '@services/trudi.service';
import { Personal } from '@shared/types/user.interface';
import { ToastrService } from 'ngx-toastr';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { FilesService } from '@services/files.service';
import { REIFormDocumentStatus } from '@shared/enum/share.enum';
import { ReiFormService } from '@services/rei-form.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { SharedService } from '@services/shared.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { FileUploadService } from '@services/fileUpload.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';

@Component({
  selector: 'lease-renewal-widget-pt-popup',
  templateUrl: './lease-renewal-widget.component.html',
  styleUrls: ['./lease-renewal-widget.component.scss']
})
export class LeaseRenewalPTPopupComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() syncPTStatus: LeaseRenewalSyncStatus =
    LeaseRenewalSyncStatus.WAITING;
  @Input() lastTimeSynced: string | Date;
  readonly TIME_FORMAT = TIME_FORMAT;
  private componentDestroyed$ = new Subject<void>();
  public popupState = {
    showLeaseRenewalModal: false
  };
  public readonly: boolean = false;
  public readonlyTenancy: boolean = false;
  public disableRemoveButton: boolean = false;
  public listOfFile;
  public listTenancy: Personal[];
  public leaseRenewalSync: LeaseRenewalSync;
  public currentDecision;
  public dataGetSyncDataLeaseResponse: IWidgetLease = {};
  public isConsole: boolean;
  public isDisableSyncButton: boolean = false;
  readonly LeaseRenewalSyncStatus = LeaseRenewalSyncStatus;
  readonly synData = FORMAT_ICON_SYNC;
  isArchiveMailbox: boolean;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$.pipe(
    map((format) => TIME_FORMAT + ' ' + format)
  );
  public modalId = StepKey.propertyTree.leaseRenewal;

  constructor(
    public taskService: TaskService,
    public trudiService: TrudiService,
    public toastService: ToastrService,
    public filesService: FilesService,
    public reiFormService: ReiFormService,
    public stepService: StepService,
    private eventCalendarService: EventCalendarService,
    private inboxService: InboxService,
    private widgetFormPTService: WidgetFormPTService,
    private widgetPTService: WidgetPTService,
    private leaseRenewalService: LeaseRenewalService,
    private propertyService: PropertiesService,
    private agencyService: AgencyService,
    private sharedService: SharedService,
    private agencyDateFormatService: AgencyDateFormatService,
    private showSidebarRightService: ShowSidebarRightService,
    private fileUpload: FileUploadService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['syncPTStatus']?.currentValue) {
      this.syncPTStatus = changes['syncPTStatus']?.currentValue.trim();
      this.readonly = this.syncPTStatus === LeaseRenewalSyncStatus.INPROGRESS;
      this.disableRemoveButton =
        this.syncPTStatus === LeaseRenewalSyncStatus.INPROGRESS;

      if (this.syncPTStatus === LeaseRenewalSyncStatus.COMPLETED) {
        this.readonlyTenancy = true;
      }
    } else {
      this.readonly = this.readonlyTenancy = false;
      this.disableRemoveButton = false;
    }
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.widgetFormPTService.buildFormLeaseRenewalPT();
    const popupWidgetState$ = this.widgetPTService.popupWidgetState$;
    const openPopupWidgetState$ =
      this.leaseRenewalService.openPopupWidgetState$;

    merge(popupWidgetState$, openPopupWidgetState$)
      .pipe(
        takeUntil(this.componentDestroyed$),
        tap((state) => {
          if (!state || state !== EPropertyTreeType.LEASE_RENEWAL) {
            this.syncPTStatus = LeaseRenewalSyncStatus.WAITING;
            FormHelper.resetFormGroup(
              this.widgetFormPTService.leaseRenewalForm
            );
          }
        }),
        filter((state) => state === EPropertyTreeType.LEASE_RENEWAL)
      )
      .subscribe(() => {
        this.disableTenancyField();
        const { syncData } = this.trudiService.getTrudiResponse.value || {};
        this.handlePopupState({ showLeaseRenewalModal: true });
        this.getDataReiFormAction();

        if (this.hasNonEmptyObject(syncData)) {
          this.readonlyTenancy = true;
        }
      });
    this.widgetFormPTService.leaseRenewalForm.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((res) => {
        if (
          res &&
          [
            LeaseRenewalSyncStatus.COMPLETED,
            LeaseRenewalSyncStatus.FAILED
          ].includes(this.syncPTStatus)
        ) {
          this.syncPTStatus = LeaseRenewalSyncStatus.UN_SYNC;
          this.lastTimeSynced = new Date();
        }
      });
    this.propertyService.peopleList$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((res) => {
        if (res) {
          this.listTenancy = res.tenancies;
        }
      });

    this.filesService.getListFileUpload.subscribe((rs) => {
      if (!rs) return;
      this.listOfFile = rs as FileUploadProp[];
      this.listOfFile.forEach((file) => {
        file.checked = true;
      });
      this.filesService.originalLocalFiles.next(this.listOfFile);
    });

    this.trudiService.getTrudiResponse
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((response) => {
        if (response) {
          const { decisionIndex, body } = response.data?.[0] || {};
          this.currentDecision = body?.decisions?.[decisionIndex];
        }
      });
  }

  get modalWidgetState() {
    return this.widgetPTService.getPopupWidgetState();
  }

  hasNonEmptyObject(arr) {
    return (
      Array.isArray(arr) && arr.some((item) => Object.keys(item).length > 0)
    );
  }

  disableTenancyField() {
    const completeItem = this.widgetPTService.leaseRenewals?.value?.find(
      (item) => item.status === LeaseRenewalSyncStatus.COMPLETED
    );
    const notCompleteItem =
      completeItem &&
      this.widgetPTService.leaseRenewals?.value?.find(
        (otherItem) =>
          otherItem.tenancyId === completeItem.tenancyId &&
          otherItem.status !== LeaseRenewalSyncStatus.COMPLETED
      );

    if (notCompleteItem) {
      this.readonlyTenancy = true;
      this.widgetFormPTService.leaseRenewalForm.get('tenancy').disable();
    }
  }

  getDataReiFormAction() {
    this.taskService.currentTaskId$
      .pipe(
        switchMap((taskId) => {
          if (taskId) {
            return this.reiFormService.getFormsForWidget(taskId);
          }

          return of([]);
        }),
        map((forms) =>
          forms.sort(
            (firstForm, secondForm) =>
              dayjs(secondForm.updatedAt).unix() -
              dayjs(firstForm.updatedAt).unix()
          )
        ),
        map((forms) => ({ result: [...forms] }))
      )
      .subscribe((res) => {
        const arrMatched = res.result.filter(
          (item) =>
            item.trudiButtonAction ===
              LeaseRenewalRequestButtonAction.createLeaseAgreementSendToTenants &&
            item.status === REIFormDocumentStatus.SIGNED
        );

        const reiFormFileAction = arrMatched.map(({ propertyDocument }) => {
          const { name, fileType, mediaLink, size } = propertyDocument || {};
          return {
            title: name,
            fileName: name,
            fileType: fileType.name,
            mediaLink: mediaLink,
            fileSize: size,
            icon: this.filesService.getFileIcon(name),
            propertyId: this.propertyService.currentPropertyId.value,
            propertyIds: [],
            isReiForm: true
          };
        });
        this.leaseRenewalService.getSyncDataLeaseResponse
          .pipe(takeUntil(this.componentDestroyed$))
          .subscribe((rs) => {
            if (!rs) return;
            this.dataGetSyncDataLeaseResponse = rs;
            const { status, lastTimeSync } = rs;
            this.syncPTStatus = status;
            this.lastTimeSynced = lastTimeSync;
            if (rs?.status === LeaseRenewalSyncStatus.INPROGRESS) {
              this.filesService.updateListFileUpload = this.listOfFile?.length
                ? [...reiFormFileAction, ...rs?.file]
                : this.listOfFile;
            } else if (reiFormFileAction?.length) {
              const files =
                this.widgetPTService.leaseRenewals?.value[0]?.file || [];
              this.filesService.updateListFileUpload = [
                ...reiFormFileAction,
                ...files
              ] as FileUploadProp[];
            }
          });
      });
  }

  async handleGetListFile(fileSelected: FileUploadProp[]) {
    this.listOfFile = fileSelected;
  }

  getPayloadSync() {
    const propertyId = this.propertyService.newCurrentProperty.value.id;
    const { id, agencyId } = this.taskService.currentTask$.getValue();

    const { leaseEnd, leaseStart, rentEffective, rentSchedule, rentType } =
      this.widgetFormPTService.leaseRenewalForm.value || {};

    return {
      propertyId,
      taskId: id,
      agencyId,
      variable: {
        leaseEnd: leaseEnd
          ? this.agencyDateFormatService
              .expectedTimezoneStartOfDay(leaseEnd)
              .toISOString()
          : '',
        leaseStart: leaseStart
          ? this.agencyDateFormatService
              .expectedTimezoneStartOfDay(leaseStart)
              .toISOString()
          : '',
        effectiveDate: rentEffective
          ? this.agencyDateFormatService
              .expectedTimezoneStartOfDay(rentEffective)
              .toISOString()
          : null,
        rentAmount: rentSchedule || null,
        frequency: rentType || null,
        tenancyId:
          this.widgetFormPTService.leaseRenewalForm.get('tenancy').value,
        file: this.listOfFile
      }
    };
  }

  handleSyncPT() {
    if (this.isArchiveMailbox) return;
    const currentStep = this.stepService.currentPTStep.getValue();
    const payload = this.getPayloadSync();
    const {
      leaseStart,
      leaseEnd,
      rentAmount,
      frequency,
      tenancyId,
      effectiveDate,
      file
    } = payload.variable;
    const matchedItem = this.listTenancy.find((item) => item.id === tenancyId);
    if (this.widgetFormPTService.leaseRenewalForm.invalid) {
      this.widgetFormPTService.leaseRenewalForm.markAllAsTouched();
      return;
    }
    this.showSidebarRightService.handleToggleSidebarRight(true);
    const dataLease = this.widgetFormPTService.formatDataLease(
      LeaseRenewalSyncStatus.INPROGRESS,
      leaseStart,
      leaseEnd,
      rentAmount,
      frequency,
      tenancyId,
      matchedItem.name,
      effectiveDate,
      '',
      file
    );

    this.leaseRenewalService.updateDataSyncResponse = dataLease;
    this.widgetPTService.setPTWidgetStateByType(
      PTWidgetDataField.LEASE_RENEWAL,
      'UPDATE',
      [dataLease]
    );

    this.handlePopupState({ showLeaseRenewalModal: false });
    this.leaseRenewalService.syncFixedTermLease(payload).subscribe({
      next: (res) => {
        if (res.dataSync) {
          const newDataSync = res.dataSync?.map((item) => ({
            ...item,
            firstTimeSyncSuccess:
              item?.status === LeaseRenewalSyncStatus.COMPLETED
          }));
          this.widgetPTService.setPTWidgetStateByType(
            PTWidgetDataField.LEASE_RENEWAL,
            'UPDATE',
            [newDataSync?.[0]]
          );

          this.leaseRenewalService.updateDataSyncResponse = newDataSync[0];
          const { errorSync, status, file } = res.dataSync[0] || {};
          this.syncPTStatus = status;
          this.readonly = false;
          this.filesService.updateListFileUpload = file || [];
          if (errorSync) {
            this.toastService.error(errorSync);
            this.widgetFormPTService.leaseRenewalForm.get('tenancy').enable();
          }
          const trudiResponeTemplate =
            this.trudiService.getTrudiResponse?.getValue();
          if ([LeaseRenewalSyncStatus.COMPLETED].includes(status)) {
            this.eventCalendarService.refreshListEventCalendarWidget(
              this.taskService.currentTaskId$.getValue()
            );
            if (trudiResponeTemplate?.isTemplate) {
              this.stepService.setChangeBtnStatusFromPTWidget(true);
              this.leaseRenewalService.updateButtonLeaseRenewalStatus(
                res?.dataSync?.[0]?.id
              );
            } else {
              this.leaseRenewalService
                .updateButtonStatus(
                  LeaseRenewalRequestButtonAction.sendNewLeaseDetailToPropertyTree,
                  TrudiButtonEnumStatus.COMPLETED
                )
                .subscribe((res) => {
                  this.leaseRenewalService.leaseRenewalRequestResponse.next(
                    res
                  );
                });
            }
          }
        }
      },
      error: () => {},
      complete: () => {
        this.filesService.originalLocalFiles.next([]);
      }
    });
  }

  cancel() {
    this.filesService.originalLocalFiles.next([]);
    this.isDisableSyncButton = false;
    this.handlePopupState({ showLeaseRenewalModal: false });
    FormHelper.resetFormGroup(this.widgetFormPTService.leaseRenewalForm);
    this.filesService.updateListFileUpload = [];
    this.widgetPTService.setPopupWidgetState(null);
    this.widgetFormPTService.leaseRenewalForm.get('tenancy').enable();
    this.preventButtonService.deleteProcess(
      EButtonStepKey.LEASE_RENEWAL,
      EButtonType.STEP
    );
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  setStatusyncButtonEvent(status: boolean) {
    this.isDisableSyncButton = status;
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
    FormHelper.resetFormGroup(this.widgetFormPTService.leaseRenewalForm);
  }
}
