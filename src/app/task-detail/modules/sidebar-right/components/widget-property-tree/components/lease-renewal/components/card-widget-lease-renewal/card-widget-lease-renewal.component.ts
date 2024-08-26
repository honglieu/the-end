import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
  EPropertyTreeType,
  IWidgetLease,
  LIST_TYPE_RENT
} from '@/app/task-detail/utils/functions';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { WidgetFormPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property-form.service';
import { LoadingService } from '@services/loading.service';
import { LeaseRenewalService } from '@services/lease-renewal.service';
import { TaskService } from '@services/task.service';
import { PropertiesService } from '@services/properties.service';
import { AgencyService } from '@services/agency.service';
import {
  LeaseRenewalRequestButtonAction,
  LeaseRenewalSyncStatus
} from '@shared/enum/lease-renewal-Request.enum';
import { Personal } from '@shared/types/user.interface';
import { ToastrService } from 'ngx-toastr';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { FilesService } from '@services/files.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { FrequencyRental } from '@shared/types/trudi.interface';
import { TrudiService } from '@services/trudi.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { EButtonStepKey } from '@trudi-ui';

@Component({
  selector: 'card-widget-lease-renewal',
  templateUrl: './card-widget-lease-renewal.component.html',
  styleUrls: ['./card-widget-lease-renewal.component.scss']
})
export class CardLeaseRenewalComponent implements OnInit, OnDestroy {
  private componentDestroyed$ = new Subject<void>();
  @Input() widgetItem?: IWidgetLease;

  public popupState = {
    showConfirmRemove: false
  };

  public itemLease: {
    endDataFormatted: string;
    leaseStartFormatted: string;
    tenancyName: string;
    frequencyType: string;
    rentAmount: string;
    leaseSign: string;
  };

  public listTenancy: Personal[];
  public dateFormatDay =
    this.agencyDateFormatService.dateFormat$.getValue().DATE_FORMAT_DAYJS;
  readonly EButtonStepKey = EButtonStepKey;

  constructor(
    private widgetPTService: WidgetPTService,
    private widgetFormPTService: WidgetFormPTService,
    public loadingService: LoadingService,
    public leaseRenewalService: LeaseRenewalService,
    public taskService: TaskService,
    private propertyService: PropertiesService,
    private agencyService: AgencyService,
    private toastService: ToastrService,
    public filesService: FilesService,
    public trudiService: TrudiService,
    public stepService: StepService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnInit(): void {
    const {
      endDataFormatted,
      leaseStartFormatted,
      frequencyType,
      tenancyName,
      rentAmount,
      leaseSign
    } = this;
    this.itemLease = {
      endDataFormatted,
      leaseStartFormatted,
      frequencyType,
      tenancyName,
      rentAmount,
      leaseSign
    };

    this.propertyService.peopleList$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((res) => {
        if (res) {
          this.listTenancy = res.tenancies;
        }
      });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  get endDataFormatted() {
    return this.widgetItem.endDate
      ? this.agencyDateFormatService
          .agencyDayJs(this.widgetItem.endDate)
          .format(this.dateFormatDay)
      : 'Unknown';
  }

  get leaseStartFormatted() {
    return this.widgetItem.startDate
      ? this.agencyDateFormatService
          .agencyDayJs(this.widgetItem.startDate)
          .format(this.dateFormatDay) + ' -'
      : ' ';
  }

  get tenancyName() {
    return this.widgetItem.userPropertyGroup.name || '';
  }

  get frequencyType() {
    const matchedFrequency = LIST_TYPE_RENT.find(
      (item) => item.value === this.widgetItem.frequency
    );
    return matchedFrequency?.label
      ? ' ' + matchedFrequency?.label.toLowerCase()
      : '';
  }

  get rentAmount() {
    return this.widgetItem.rent ? '$ ' + this.widgetItem.rent : ' ';
  }

  get leaseSign() {
    return `${this.widgetItem.file?.length | 0} attachments`;
  }
  handleOpenModal() {
    this.widgetPTService.setPopupWidgetState(EPropertyTreeType.LEASE_RENEWAL);
    this.setFormModal();
  }

  setFormModal() {
    const {
      startDate,
      endDate,
      effectiveDate,
      rent,
      frequency,
      tenancyId,
      lastTimeSync,
      file
    } = this.widgetItem || {};

    const isFirstTimeSync = [
      LeaseRenewalSyncStatus.PENDING,
      LeaseRenewalSyncStatus.WAITING
    ].includes(this.widgetItem?.status as LeaseRenewalSyncStatus);
    const {
      frequencyRent,
      leaseEnd,
      leaseStart,
      rent: rentFromLastStep
    } = this.leaseRenewalService.getPrefillDataFromLastStep(
      startDate,
      endDate,
      rent as number,
      frequency as FrequencyRental
    );

    const dataPrefillLease = {
      leaseEnd: isFirstTimeSync
        ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            leaseEnd
          )
        : this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            endDate
          ),
      leaseStart: isFirstTimeSync
        ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            leaseStart
          )
        : this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            startDate
          ),
      rentEffective:
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          effectiveDate
        ),
      rentSchedule: isFirstTimeSync ? rentFromLastStep : rent,
      rentType: isFirstTimeSync ? frequencyRent : frequency,
      tenancy: tenancyId
    };
    this.widgetFormPTService.leaseRenewalForm.patchValue({
      ...dataPrefillLease
    });
    this.leaseRenewalService.updateTimeAndStatusSync = {
      status: this.widgetItem?.status as LeaseRenewalSyncStatus,
      lastTimeSync: lastTimeSync
    };
    this.updateListFileItems();
  }

  updateListFileItems() {
    const leaseRenewalsFile = [
      ...(this.widgetPTService.leaseRenewals?.value[0]?.file || [])
    ];
    this.filesService.updateListFileUpload = leaseRenewalsFile;
  }

  handleRetryWidget(item: IWidgetLease) {
    const currentStep = this.stepService.currentPTStep.getValue();
    const { id: propertyId } = this.propertyService.newCurrentProperty.value;
    const agencyId = this.taskService.currentTask$?.value?.agencyId;
    const taskId = this.taskService.currentTaskId$.getValue();
    const variable = {
      leaseEnd: item.endDate,
      leaseStart: item.startDate,
      effectiveDate: item.effectiveDate,
      rentAmount: item.rent?.toString(),
      frequency: item.frequency,
      tenancyId: item.tenancyId,
      file: item.file
    };

    const {
      leaseStart,
      leaseEnd,
      effectiveDate,
      rentAmount,
      frequency,
      tenancyId,
      file
    } = variable;
    const matchedItem = this.listTenancy.find((item) => item.id === tenancyId);

    this.leaseRenewalService.updateDataSyncResponse =
      this.widgetFormPTService.formatDataLease(
        LeaseRenewalSyncStatus.INPROGRESS,
        leaseStart,
        leaseEnd,
        +rentAmount,
        frequency,
        tenancyId,
        matchedItem?.name,
        effectiveDate,
        file
      );

    this.leaseRenewalService
      .syncFixedTermLease({ propertyId, taskId, agencyId, variable })
      .subscribe({
        next: (res) => {
          if (res.dataSync) {
            this.widgetPTService.setPTWidgetStateByType(
              PTWidgetDataField.LEASE_RENEWAL,
              'UPDATE',
              [res.dataSync?.[0]]
            );

            this.leaseRenewalService.updateDataSyncResponse = res.dataSync[0];
            const { errorSync, status } = res.dataSync[0] || {};

            if (errorSync) {
              this.toastService.error(errorSync);
            }
            const trudiResponeTemplate =
              this.trudiService.getTrudiResponse?.getValue();
            if ([LeaseRenewalSyncStatus.COMPLETED].includes(status)) {
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
                    this.leaseRenewalService.updateResponseData('INIT', res);
                  });
              }
            }
          }
        },
        error: () => {},
        complete: () => {}
      });
  }

  handleRemoveWidget(item: IWidgetLease) {
    this.leaseRenewalService
      .removeLeaseRenewalSync({ taskId: this.taskService.currentTaskId$.value })
      .subscribe((res) => {
        if (res) {
          this.widgetPTService.setPTWidgetStateByType(
            PTWidgetDataField.LEASE_RENEWAL,
            'REMOVE',
            res
          );

          this.leaseRenewalService.updateDataSyncResponse = res?.[0];
          this.leaseRenewalService.updateTimeAndStatusSync = {
            status: LeaseRenewalSyncStatus.WAITING
          };
          this.filesService.updateListFileUpload = [];
          this.handlePopupState({ showConfirmRemove: false });
        }
      });
  }

  checkShowPoupConfirm() {
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
      this.handlePopupState({ showConfirmRemove: false });
      this.handleCancel(this.widgetItem);
    } else {
      this.handlePopupState({ showConfirmRemove: true });
    }
  }

  handleCancel(item: IWidgetLease) {
    this.leaseRenewalService
      .removeLeaseRenewalSync({ taskId: this.taskService.currentTaskId$.value })
      .subscribe((res) => {
        if (res) {
          this.widgetPTService.setPTWidgetStateByType(
            PTWidgetDataField.LEASE_RENEWAL,
            'REMOVE',
            res
          );

          this.leaseRenewalService.updateDataSyncResponse = res?.[0];
          this.leaseRenewalService.updateTimeAndStatusSync = {
            status: LeaseRenewalSyncStatus.WAITING
          };
          this.filesService.updateListFileUpload = [];
          this.handlePopupState({ showConfirmRemove: false });
          // this.leaseRenewalService
          //   .updateButtonStatus(
          //     LeaseRenewalRequestButtonAction.confirmTenancy,
          //     TrudiButtonEnumStatus.PENDING
          //   )
          //   .subscribe((res) => {
          //     this.leaseRenewalService.leaseRenewalRequestResponse.next(res);
          //   });
        }
      });
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }
}
