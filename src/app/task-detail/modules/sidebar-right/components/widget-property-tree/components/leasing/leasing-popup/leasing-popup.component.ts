import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Subject, filter, of, switchMap, takeUntil } from 'rxjs';
import { ViewChild } from '@angular/core';
import { TaskService } from '@services/task.service';
import { PropertiesService } from '@services/properties.service';
import { LeasingService } from '@services/leasing.service ';
import dayjs from 'dayjs';
import { InspectionDate, InspectionDateJob } from '@shared/types';
import { PHONE_PREFIXES, TIME_FORMAT } from '@services/constants';
import { ToastrService } from 'ngx-toastr';
import {
  AddTenancyJob,
  ITenancy,
  LeasingWidgetRequestTrudiResponse,
  TrudiVariableTenancy
} from '@shared/types/trudi.interface';
import { formatterAmount } from '@shared/feature/function.feature';
import { SyncPropertyTreeLeasingService } from '@/app/leasing/services/sync-property-tree-leasing.service';
import { SyncPropertyTreeLeasingFormService } from '@/app/leasing/services/sync-property-tree-leasing-form.service';
import { SyncPropertyTreeLeasingApiService } from '@/app/leasing/services/sync-property-tree-leasing-api.service';
import { ContactMethod } from '@/app/leasing/utils/leasingType';
import {
  convertTime12to24,
  isEmptyObject
} from '@/app/leasing/utils/functions';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { LeasingWidgetService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/leasing.service';
import { omitBy } from 'lodash-es';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { TrudiService } from '@services/trudi.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { SharedService } from '@services/shared.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { hmsToSecondsOnly } from '@shared/components/date-picker2/util';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { formatPhoneNumber } from '@/app/dashboard/modules/agency-settings/components/policies/utils/helper-function';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { CompanyService } from '@services/company.service';
import uuid4 from 'uuid4';
import { PreventButtonService } from '@trudi-ui';
import { EButtonStepKey, EButtonType, StepKey } from '@trudi-ui';

@Component({
  selector: 'leasing-popup',
  templateUrl: './leasing-popup.component.html',
  styleUrls: ['./leasing-popup.component.scss']
})
export class LeasingPopupComponent implements OnInit, OnDestroy {
  @ViewChild('entryInspection') entryInspectionRef: ElementRef;
  private unsubscribe = new Subject<void>();
  public syncStatus: ESyncStatus | string = ESyncStatus.NOT_SYNC;
  public lastTimeSync: string = '';
  public TYPE_SYNC_STATUS = ESyncStatus;
  public tenancyId: string = '';
  public syncEntryInspection: boolean = false;
  public leasingList;
  public isOpenAddContactPopup: boolean = false;
  public isOpenConfirmTenantContactPopup: boolean = false;
  private timeOut: NodeJS.Timeout;
  isArchiveMailbox: boolean;
  public isConsole: boolean;
  public areaCode: string;
  public buttonKey = EButtonStepKey.NEW_TENANCY;
  public modalId = StepKey.propertyTree.newTenancy;

  constructor(
    public taskService: TaskService,
    public propertyService: PropertiesService,
    public agencyService: AgencyService,
    public cdr: ChangeDetectorRef,
    public leasingService: LeasingService,
    public syncPropertyTreeLeasingService: SyncPropertyTreeLeasingService,
    public syncPropertyTreeLeasingFormService: SyncPropertyTreeLeasingFormService,
    public syncPropertyTreeLeasingApiService: SyncPropertyTreeLeasingApiService,
    public widgetPTService: WidgetPTService,
    public leasingWidgetService: LeasingWidgetService,
    public trudiService: TrudiService,
    public stepService: StepService,
    private toastService: ToastrService,
    private calendarEventWidgetService: EventCalendarService,
    private inboxService: InboxService,
    private sharedService: SharedService,
    private showSidebarRightService: ShowSidebarRightService,
    private agencyDateFormatService: AgencyDateFormatService,
    private companyService: CompanyService,
    private PreventButtonService: PreventButtonService
  ) {}

  get leasingForm(): FormGroup {
    return this.syncPropertyTreeLeasingFormService.leasingForm;
  }

  get bondForm(): FormGroup {
    return this.syncPropertyTreeLeasingFormService.bondForm;
  }

  get tenantContacts(): AbstractControl {
    return this.leasingForm.get('tenantContacts');
  }

  get leasePeriodType(): AbstractControl {
    return this.leasingForm.get('leasePeriodType');
  }

  get leasePeriod(): AbstractControl {
    return this.leasingForm.get('leasePeriod');
  }

  get contactMethodForm() {
    return this.syncPropertyTreeLeasingFormService.contactMethodForm;
  }

  ngOnInit(): void {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.areaCode = this.agencyService?.isRentManagerCRM(company)
          ? PHONE_PREFIXES.US[0]
          : PHONE_PREFIXES.AU[0];
      });
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    if (!this.syncPropertyTreeLeasingFormService.isProcessingForm) {
      this.syncPropertyTreeLeasingFormService.buildForm();
      this.syncPropertyTreeLeasingFormService.buildFormTenantContact();
      this.syncPropertyTreeLeasingFormService.buildFormBond();
      this.syncPropertyTreeLeasingFormService.buildFormContactMethod();
    }
    this.syncPropertyTreeLeasingFormService.resetLeasingForm();
    this.checkSyncStatus();
    this.widgetPTService
      .getPTWidgetStateByType<LeasingWidgetRequestTrudiResponse[]>(
        PTWidgetDataField.LEASING
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res?.length) {
          this.leasingList = res[0];
          this.tenancyId = res[0]?.tenancyId;
          this.syncPropertyTreeLeasingService.isExpandPopupPT$.next(false);
          if (
            res[0]?.syncStatus &&
            this.syncStatus !== ESyncStatus.INPROGRESS
          ) {
            this.syncStatus = res[0]?.syncStatus || ESyncStatus.NOT_SYNC;
            if (res[0]?.syncStatus === ESyncStatus.COMPLETED) {
              this.syncEntryInspection = true;
            } else {
              this.syncEntryInspection = false;
            }
          } else {
            this.syncStatus === ESyncStatus.INPROGRESS;
            this.syncEntryInspection = true;
          }
          if (res[0]?.data) {
            const {
              autoEmailInvoices = false,
              autoEmailReceipts = false,
              doNotContractTenant = false,
              hasNotConsentedForElectronicNotices = false,
              preferredEmail = ''
            } = res[0]?.data?.preferredContactMethod || {};
            const leasing = this.mapAddTenancyJob(res[0]?.data);
            const bond = this.mapBond(res[0]?.data);
            const contactMethod = {
              receipt: autoEmailReceipts,
              invoice: autoEmailInvoices,
              notice: hasNotConsentedForElectronicNotices,
              offer: doNotContractTenant,
              contactEmail: preferredEmail
            };
            this.leasingForm.patchValue(leasing);
            this.bondForm.patchValue(bond);
            this.contactMethodForm.patchValue(contactMethod);
          }
          if (res[0]?.tenancy && !isEmptyObject(res[0]?.tenancy)) {
            this.leasingForm.patchValue(
              this.mapTenancyContacts(res[0]?.tenancy, true)
            );
          }
          if (
            res[0]?.tenancy?.userPropertyGroupLeases?.[0] &&
            !res[0]?.syncStatus
          ) {
            const { leasing, bond } = this.mapUserPropertyGroupLeases(
              res[0]?.tenancy
            );
            this.leasingForm.patchValue(
              omitBy(leasing, (v) => ['', null].includes(v))
            );
            this.bondForm.patchValue(bond);
          }
          res && this.updateStatusEntryInspection(res[0]);
          if (this.leasePeriodType.value === 'userDefined') {
            this.leasePeriod.disable();
          }
        } else {
          this.updateStatusSync(ESyncStatus.NOT_SYNC);
        }
      });

    this.taskService.currentTask$
      .pipe(
        takeUntil(this.unsubscribe),
        filter(Boolean),
        switchMap((currentTask) => {
          if (!currentTask.property?.isTemporary) {
            return this.syncPropertyTreeLeasingApiService.getListAccountByIdToPT(
              currentTask.agencyId
            );
          }
          return of(null);
        })
      )
      .subscribe((res) => {
        this.updateBondAccount();
        this.syncPropertyTreeLeasingService.listAccountPT$.next(res);
      });

    this.syncPropertyTreeLeasingService.isExpandPopupPT$.subscribe((value) => {
      if (value && this.tenancyId && this.syncEntryInspection) {
        this.timeOut = setTimeout(() => {
          this.entryInspectionRef.nativeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 500);
      }
    });

    this.leasingWidgetService.isShowAddTenantContactPopup$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => (this.isOpenAddContactPopup = data));

    this.leasingWidgetService.isShowConfirmTenantContactPopup$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => (this.isOpenConfirmTenantContactPopup = data));
  }

  mapBond({ securityDeposit }: Pick<AddTenancyJob, 'securityDeposit'>) {
    return {
      ...securityDeposit,
      amount: formatterAmount(securityDeposit?.amount),
      amountLodgedDirect: !securityDeposit?.amountLodgedDirect
        ? '0.00'
        : formatterAmount(securityDeposit?.amountLodgedDirect)
    };
  }

  mapAddTenancyJob(property: AddTenancyJob) {
    const { paymentTypes, periodTypes } =
      this.syncPropertyTreeLeasingFormService.generateEnumPayload();

    return {
      ...property,
      ...property.securityDeposit,
      leaseEndDate:
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          property.leaseEndDate
        ) ?? '',
      leaseStartDate:
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          property.leaseStartDate
        ) ?? '',
      nextRentReview:
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          property.nextRentReview
        ) ?? '',
      originalLeaseStartDate:
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          property.originalLeaseStartDate
        ) ?? '',
      rentStartDate:
        this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
          property.rentStartDate
        ) ?? '',
      rentAmount: formatterAmount(property?.rentAmount),
      doChargeNewTenancyFees: !property?.doNotChargeNewTenancyFees,
      paymentPeriod: paymentTypes?.[property.paymentPeriod] || '',
      leasePeriodType: periodTypes?.[property.leasePeriodType] || '',
      tenantContacts: this.formatPhoneContactInfo(property['tenantContacts'])
    };
  }

  mapTenancyContacts(tenancy: ITenancy, isVariable: boolean) {
    const tenantContacts =
      tenancy.userProperties && tenancy.userProperties.length > 0
        ? tenancy.userProperties.map((userProperty) => {
            const MobilePhoneNumber = userProperty?.user.mobileNumber
              ?.match(/\d/g)
              ?.join('');
            return {
              isPrimary: userProperty.isPrimary,
              isVariable,
              contact: {
                givenName: userProperty?.user.firstName || '',
                familyName: userProperty?.user.lastName || '',
                address: {
                  unit: userProperty?.property.unitNo || '',
                  streetNumber: userProperty?.property.streetNumber || '',
                  addressLine1: userProperty?.property.streetline || '',
                  suburb: userProperty?.property.suburb || '',
                  state: userProperty?.property.state || '',
                  postcode: userProperty?.property.postCode || '',
                  country: userProperty?.property.country || ''
                },
                contactInfos: [
                  {
                    contactMethod: ContactMethod.Email,
                    details: userProperty?.user.email || ''
                  },
                  {
                    contactMethod: ContactMethod.HomePhone,
                    details:
                      userProperty?.user.phoneNumber || MobilePhoneNumber || ''
                  }
                ]
              }
            };
          })
        : [];
    return {
      tenantContacts: tenantContacts
    };
  }

  mapEntryInspection(inspectionData: InspectionDate | InspectionDateJob) {
    if (!inspectionData) return null;

    const startDate = new Date(inspectionData.startTime.replace('Z', ''));
    const endDate = new Date(inspectionData.endTime.replace('Z', ''));

    return {
      inspectionDate: startDate,
      startTime: hmsToSecondsOnly(
        convertTime12to24(dayjs(startDate).format(TIME_FORMAT))
      ),
      endTime: hmsToSecondsOnly(
        convertTime12to24(dayjs(endDate).format(TIME_FORMAT))
      )
    };
  }

  mapUserPropertyGroupLeases(tenancy: TrudiVariableTenancy) {
    const property = tenancy.userPropertyGroupLeases?.[0];

    return {
      leasing: {
        tenancyName: tenancy.name,
        doChargeNewTenancyFees: property?.chargeNewTenancyFee || false,
        leaseEndDate:
          this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            property.endDate
          ) ?? '',
        leasePeriod: property?.leasePeriod,
        leasePeriodType: property?.leasePeriodType?.toLowerCase() || '',
        leaseStartDate:
          this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            property.startDate
          ) ?? '',
        nextRentReview:
          this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            property.nextRentReview
          ) ?? '',
        originalLeaseStartDate:
          this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            property.originalLeaseStartDate
          ) ?? '',
        paymentPeriod: property?.frequency?.toLowerCase() || '',
        rentAmount: formatterAmount(property?.rentAmount),
        rentDescription: property.rentDescription,
        rentStartDate:
          this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
            property.rentStartDate
          ) ?? ''
      },
      bond: {
        accountId: property.bondAccountId,
        accountName: property.bondSubmitted,
        amount: formatterAmount(property?.bondAmount),
        amountLodgedDirect: formatterAmount(property?.bondAmountLodgedDirect)
      }
    };
  }

  updateBondAccount() {
    const accountPT = this.syncPropertyTreeLeasingService.listAccountPT$.value;
    const account = accountPT?.find(
      (e) => e.id === this.leasingForm.value.accountId
    );

    if (account) {
      this.bondForm.patchValue({
        accountName: account.name,
        accountId: account.id
      });
    }
  }

  updateStatusEntryInspection(job) {
    this.lastTimeSync = job?.syncDate;
    this.updateBondAccount();
  }

  updateStatusSync(status) {
    this.leasingWidgetService.setSyncLeasingStatus(status);
  }

  handleErrorSync() {
    this.syncStatus = ESyncStatus.FAILED;
  }

  syncLeaseStartToPT() {
    if (this.isArchiveMailbox) return;
    const currentStep = this.stepService.currentPTStep.getValue();
    this.syncPropertyTreeLeasingFormService.updateValueAndValidityLeasingForm();
    if (this.leasingForm.invalid || this.bondForm.invalid) {
      this.leasingForm.markAllAsTouched();
      this.bondForm.markAllAsTouched();
      return;
    }
    this.showSidebarRightService.handleToggleSidebarRight(true);
    this.updateStatusSync(ESyncStatus.INPROGRESS);
    this.syncEntryInspection = true;
    this.widgetPTService.setPopupWidgetState(null);
    const payload = this.syncPropertyTreeLeasingFormService.mapPropertyTree();
    if (this.leasingList?.id) {
      this.leasingWidgetService
        .resyncLeasingToPT(this.leasingList?.id, payload)
        .subscribe({
          next: (res) => {
            this.widgetPTService.setPTWidgetStateByType(
              PTWidgetDataField.LEASING,
              'UPDATE',
              [
                {
                  ...res?.lease,
                  data: {
                    ...res?.lease.data,
                    firstTimeSyncSuccess:
                      res?.lease.syncStatus === ESyncStatus.COMPLETED
                  }
                }
              ]
            );
            const trudiBtnResponeData =
              this.trudiService.getTrudiResponse?.getValue();
            if (res?.lease?.syncStatus === ESyncStatus.COMPLETED) {
              this.leasingWidgetService.handleRefreshListUserProperty();
              this.updateStatusEntryInspection(res);
              this.syncEntryInspection = true;
              if (trudiBtnResponeData?.isTemplate) {
                this.stepService.setChangeBtnStatusFromPTWidget(true);
                this.stepService.updateButtonStatusTemplate(
                  currentStep?.id,
                  EPropertyTreeButtonComponent.NEW_TENANCY,
                  EButtonAction.PT_NEW_COMPONENT,
                  res?.lease?.id
                );
              } else {
                this.leasingWidgetService.updateLeasingTrudiResponse(
                  res?.lease?.idUserPropertyGroup
                );
              }
              this.calendarEventWidgetService.refreshListEventCalendarWidget(
                this.taskService.currentTaskId$.getValue()
              );
            }
            if (res?.lease?.errorMessSync) {
              this.toastService.error(res?.lease?.errorMessSync);
            }
            this.updateStatusSync(res?.lease?.syncStatus);
          },
          error: () => {
            this.handleErrorSync();
          }
        });
    } else {
      this.widgetPTService.setPTWidgetStateByType(
        PTWidgetDataField.LEASING,
        'UPDATE',
        [
          {
            createdAt: new Date(),
            data: payload,
            deletedAt: null,
            errorMessSync: null,
            firstTimeSyncSuccess: false,
            id: uuid4(),
            syncDate: new Date(),
            idUserPropertyGroup: null,
            propertyId: this.propertyService.currentPropertyId.value,
            syncStatus: ESyncStatus.INPROGRESS,
            taskId: this.taskService.currentTaskId$.getValue(),
            updatedAt: null
          }
        ]
      );
      this.leasingWidgetService.syncLeasingToPT(payload).subscribe({
        next: (res) => {
          this.widgetPTService.setPTWidgetStateByType(
            PTWidgetDataField.LEASING,
            'UPDATE',
            [
              {
                ...res?.lease,
                data: {
                  ...res?.lease.data,
                  firstTimeSyncSuccess:
                    res?.lease.syncStatus === ESyncStatus.COMPLETED
                }
              }
            ]
          );
          const trudiBtnResponeData =
            this.trudiService.getTrudiResponse?.getValue();
          if (res?.lease?.syncStatus === ESyncStatus.COMPLETED) {
            this.updateStatusEntryInspection(res);
            this.leasingWidgetService.handleRefreshListUserProperty();
            this.syncEntryInspection = true;
            if (trudiBtnResponeData?.isTemplate) {
              this.stepService.setChangeBtnStatusFromPTWidget(true);
              this.stepService.updateButtonStatusTemplate(
                currentStep?.id,
                EPropertyTreeButtonComponent.NEW_TENANCY,
                EButtonAction.PT_NEW_COMPONENT,
                res?.lease?.id
              );
            } else {
              this.leasingWidgetService.updateLeasingTrudiResponse(
                res?.lease?.idUserPropertyGroup
              );
            }
            this.calendarEventWidgetService.refreshListEventCalendarWidget(
              this.taskService.currentTaskId$.getValue()
            );
          }
          if (res?.lease?.errorMessSync) {
            this.toastService.error(res?.lease?.errorMessSync);
            this.syncEntryInspection = false;
          }
          this.updateStatusSync(res?.lease?.syncStatus);
        },
        error: () => {
          this.syncEntryInspection = false;
          this.handleErrorSync();
        }
      });
    }
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
  }

  handleCloseModal() {
    this.widgetPTService.setPopupWidgetState(null);
    this.syncPropertyTreeLeasingFormService.resetLeasingForm();
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
  }

  closeAddTenantContactPopup() {
    this.leasingWidgetService.setShowAddTenantContactPopup(false);
  }

  onCloseConfirmTenantContact() {
    this.leasingWidgetService.setShowConfirmTenantContactPopup(false);
  }

  onConfirmTenantContact(pos) {
    this.tenantContacts.setValue([
      {
        ...this.tenantContacts.value?.[pos],
        isPrimary: true
      },
      ...this.tenantContacts.value.filter(
        (contact, index) => index > 0 && index !== pos && contact
      )
    ]);

    this.onCloseConfirmTenantContact();
  }

  checkSyncStatus() {
    this.leasingWidgetService
      .getSyncLeasingStatus()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((status) => {
        if (!status) return;
        this.syncStatus = status;
      });
  }

  formatPhoneContactInfo(tenantContacts) {
    if (!tenantContacts.length) return [];
    return tenantContacts.map((tenantContact) => ({
      ...tenantContact,
      contact: {
        ...tenantContact.contact,
        contactInfos: tenantContact.contact?.contactInfos.map((contact) => ({
          ...contact,
          details: formatPhoneNumber(contact?.details, this.areaCode)
        }))
      }
    }));
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.syncPropertyTreeLeasingService.isExpandPopupPT$.next(false);
    clearTimeout(this.timeOut);
  }
}
